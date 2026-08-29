/**
 * Recepción de webhooks de GitHub (M-08). El endpoint solo actualiza filas
 * existentes — nunca inserta: no es una vía de entrada de contenido al feed.
 * La sincronización usa los datos del propio payload (sin llamadas a la API).
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import type { Db } from "@/lib/db/client";
import { notifyRepoUpdate } from "@/lib/db/notifications";
import { listSubscriberIds } from "@/lib/db/subscriptions";

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
  // Los eventos de instalación no llevan `repository`: se despachan antes de
  // exigirlo (C-08). `installation_repositories` es el que llega cuando se
  // cambian los repos cubiertos de una instalación que ya existía — sin él,
  // actualizar la instalación no dejaba rastro.
  if (eventName === "installation" || eventName === "installation_repositories") {
    return handleInstallationEvent(db, eventName, payload);
  }

  const repo = repoOf(payload);
  if (!repo) return { handled: false, action: "sin repository en el payload" };

  switch (eventName) {
    case "push": {
      await updateRepoData(db, repo);
      // C-06: notificar a los suscriptores del repo. En su propio try para que
      // un fallo aquí no haga reintentar a GitHub el sync entero.
      let notified = 0;
      try {
        notified = await notifySubscribersOfPush(db, repo.id, payload);
      } catch (error) {
        console.error("[webhooks] notificación de push", error);
      }
      return { handled: true, action: `push: datos refrescados (${notified} suscriptores avisados)` };
    }

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

/**
 * Aviso de push a los suscriptores (C-06): busca el repo por su id de GitHub y
 * acumula/crea la notificación de cada suscriptor con los datos del payload
 * (commits y enlace al diff). Sin commits (borrado de rama, etc.), no molesta.
 */
async function notifySubscribersOfPush(
  db: Db,
  githubRepoId: number,
  payload: Record<string, unknown>,
): Promise<number> {
  const commits = Array.isArray(payload.commits) ? payload.commits.length : 0;
  if (commits === 0) return 0;

  const { data, error } = await db
    .from("repos")
    .select("id, full_name, url, status")
    .eq("github_repo_id", githubRepoId)
    .maybeSingle();
  if (error) throw new Error(`Error al buscar el repo: ${error.message}`);
  const row = data as { id: string; full_name: string; url: string; status: string } | null;
  if (!row || row.status !== "active") return 0;

  const subscribers = await listSubscriberIds(db, row.id);
  if (subscribers.length === 0) return 0;

  const compare = typeof payload.compare === "string" ? payload.compare : row.url;
  const ref = typeof payload.ref === "string" ? payload.ref : "";
  for (const recipientId of subscribers) {
    await notifyRepoUpdate(db, recipientId, {
      repo_id: row.id,
      full_name: row.full_name,
      commits,
      compare,
      ref,
    });
  }
  return subscribers.length;
}

/**
 * Alta/baja de la instalación de la App (C-08): registra el installation_id en
 * el perfil cuyo github_id coincide con la cuenta donde se instaló. Cuentas
 * sin perfil en snapstack no hacen nada (la App es pública: cualquiera puede
 * instalarla desde GitHub).
 */
async function handleInstallationEvent(
  db: Db,
  eventName: string,
  payload: Record<string, unknown>,
): Promise<WebhookResult> {
  const action = String(payload.action ?? "");
  const installation = payload.installation as
    | { id?: number; account?: { id?: number } }
    | undefined;
  const installationId = installation?.id;
  const accountId = installation?.account?.id;
  if (typeof installationId !== "number" || typeof accountId !== "number") {
    return { handled: false, action: "installation: payload incompleto" };
  }

  // Cambiar los repos cubiertos confirma que la instalación sigue viva: sirve
  // igual para registrarla si nos habíamos perdido su alta.
  if (eventName === "installation_repositories") {
    const { error } = await db
      .from("profiles")
      .update({ github_installation_id: installationId })
      .eq("github_id", accountId);
    if (error) throw new Error(`Error al registrar la instalación: ${error.message}`);
    return { handled: true, action: `installation_repositories.${action}: registrada` };
  }

  if (action === "created" || action === "unsuspend" || action === "new_permissions_accepted") {
    const { error } = await db
      .from("profiles")
      .update({ github_installation_id: installationId })
      .eq("github_id", accountId);
    if (error) throw new Error(`Error al registrar la instalación: ${error.message}`);
    return { handled: true, action: `installation.${action}: registrada` };
  }
  if (action === "deleted" || action === "suspend") {
    const { error } = await db
      .from("profiles")
      .update({ github_installation_id: null })
      .eq("github_id", accountId);
    if (error) throw new Error(`Error al limpiar la instalación: ${error.message}`);
    return { handled: true, action: `installation.${action}: retirada` };
  }
  return { handled: false, action: `installation.${action}: ignorado` };
}
