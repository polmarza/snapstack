/**
 * Recepción de webhooks de GitHub (M-08). El endpoint solo actualiza filas
 * existentes — nunca inserta: no es una vía de entrada de contenido al feed.
 * La sincronización usa los datos del propio payload (sin llamadas a la API).
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import type { Db } from "@/lib/db/client";

/** Firma HMAC SHA-256 de GitHub (X-Hub-Signature-256), en tiempo constante. */
export function verifyGithubSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
): boolean {
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const received = signatureHeader.slice("sha256=".length);
  if (received.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(received, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

/** Subconjunto del objeto `repository` que llega en todos los payloads. */
export interface WebhookRepository {
  id: number;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  topics?: string[];
  stargazers_count: number;
}

export interface WebhookResult {
  handled: boolean;
  action: string;
}

function repoOf(payload: Record<string, unknown>): WebhookRepository | null {
  const repo = payload.repository as WebhookRepository | undefined;
  return repo && typeof repo.id === "number" ? repo : null;
}

/** Refresco de datos desde el payload. Solo UPDATE por github_repo_id. */
async function updateRepoData(db: Db, repo: WebhookRepository, extra: Record<string, unknown> = {}) {
  const { error } = await db
    .from("repos")
    .update({
      full_name: repo.full_name,
      description: repo.description,
      url: repo.html_url,
      primary_language: repo.language,
      topics: repo.topics ?? [],
      stars: repo.stargazers_count,
      last_synced_at: new Date().toISOString(),
      ...extra,
    })
    .eq("github_repo_id", repo.id);
  if (error) throw new Error(`Error al sincronizar repo: ${error.message}`);
}

async function setStatus(db: Db, githubRepoId: number, status: "active" | "removed") {
  const { error } = await db
    .from("repos")
    .update({ status, last_synced_at: new Date().toISOString() })
    .eq("github_repo_id", githubRepoId);
  if (error) throw new Error(`Error al cambiar estado del repo: ${error.message}`);
}

/**
 * Despacha un evento verificado. Repos que no están en la tabla no producen
 * efecto (el UPDATE no encuentra fila); eventos no contemplados se ignoran.
 */
export async function handleGithubEvent(
  db: Db,
  eventName: string,
  payload: Record<string, unknown>,
): Promise<WebhookResult> {
  const repo = repoOf(payload);
  if (!repo) return { handled: false, action: "sin repository en el payload" };

  switch (eventName) {
    case "push":
      await updateRepoData(db, repo);
      return { handled: true, action: "push: datos refrescados" };

    // `star` es el evento moderno; `watch` (action: started) es el nombre legado del PRD.
    case "star":
    case "watch": {
      const { error } = await db
        .from("repos")
        .update({ stars: repo.stargazers_count, last_synced_at: new Date().toISOString() })
        .eq("github_repo_id", repo.id);
      if (error) throw new Error(`Error al actualizar stars: ${error.message}`);
      return { handled: true, action: "stars actualizadas" };
    }

    case "repository": {
      const action = String(payload.action ?? "");
      if (action === "deleted" || action === "privatized") {
        // Sin contenido fantasma: fuera del feed y del perfil (M-08).
        await setStatus(db, repo.id, "removed");
        return { handled: true, action: `repository.${action}: retirado` };
      }
      if (action === "publicized") {
        await setStatus(db, repo.id, "active");
        return { handled: true, action: "repository.publicized: reactivado" };
      }
      if (action === "renamed" || action === "edited") {
        await updateRepoData(db, repo);
        return { handled: true, action: `repository.${action}: datos refrescados` };
      }
      return { handled: false, action: `repository.${action}: ignorado` };
    }

    default:
      return { handled: false, action: `evento ${eventName}: ignorado` };
  }
}
