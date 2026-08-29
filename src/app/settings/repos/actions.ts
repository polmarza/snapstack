"use server";

import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/db/client";
import { ensureProfile, getProfileByClerkId } from "@/lib/db/profiles";
import {
  computeSelectionDiff,
  importOwnedRepos,
  listOwnedActiveRepos,
  removeOwnedRepos,
  selectionLimit,
  SelectionLimitError,
  RepoOwnedByAnotherProfileError,
  validateSelectionSize,
} from "@/lib/db/selection";
import { getGithubToken } from "@/lib/github/token";
import { fetchRepoReadme } from "@/lib/github/readme";
import { fetchRepoDetails, mapRepoDetailsToRow } from "@/lib/github/user-repos";
import { LINGUIST_COLORS } from "@/lib/card-seed";
import { repoBlockedTerm } from "@/lib/moderation/moderation";

export interface SaveSelectionResult {
  ok: boolean;
  added: number;
  removed: number;
  error: string | null;
}

/**
 * Guarda la selección de repos del usuario (M-02/M-03): importa los nuevos con
 * datos frescos de GraphQL, quita los deseleccionados y valida el límite en
 * servidor. Usada por /onboarding y /settings/repos.
 *
 * `languageOverrides` (fullName → lenguaje) permite fijar a mano el lenguaje de
 * repos donde Linguist no detecta ninguno (una skill en puro Markdown, por
 * ejemplo). Solo se acepta un lenguaje del catálogo oficial, y solo cuando
 * GitHub no detectó nada: la detección real nunca se pisa.
 */
export async function saveSelectionAction(
  selectedFullNames: string[],
  languageOverrides: Record<string, string> = {},
): Promise<SaveSelectionResult> {
  const fallo = (error: string): SaveSelectionResult => ({ ok: false, added: 0, removed: 0, error });

  try {
    const user = await currentUser();
    if (!user) return fallo("Invalid session. Please sign in again.");

    const db = createServiceClient();
    await ensureProfile(db, user);
    const profile = await getProfileByClerkId(db, user.id);
    if (!profile) return fallo("We couldn't find your profile.");

    const current = await listOwnedActiveRepos(db, profile.id);
    const diff = computeSelectionDiff(current, selectedFullNames);
    validateSelectionSize(diff, selectionLimit());

    if (diff.toAdd.length > 0) {
      const token = await getGithubToken(user.id);
      if (!token) return fallo("No GitHub token available. Please sign in with GitHub again.");
      const now = new Date();
      const details = await Promise.all(diff.toAdd.map((name) => fetchRepoDetails(token, name)));

      // Autorización: solo puedes importar repos tuyos. La lista de la pantalla ya
      // los filtra, pero esta acción se puede invocar con los argumentos que sea, y
      // la consulta de detalle resuelve cualquier repo público — sin esta comprobación
      // bastaría con pedir el nombre del repo de otro para colgarlo de tu perfil.
      const ajeno = details.find(
        (d) => d.owner.login.toLowerCase() !== profile.username.toLowerCase(),
      );
      if (ajeno) {
        return fallo(`"${ajeno.nameWithOwner}" isn't yours: you can only add your own repos.`);
      }

      // README para la página de detalle (C-05). Que falle no rompe el import:
      // el backfill (pnpm backfill:readmes) lo recoge después.
      const readmes = await Promise.all(
        details.map((d) => fetchRepoReadme(token, d.nameWithOwner).catch(() => null)),
      );

      const rows = details.map((d, i) => {
        const row = mapRepoDetailsToRow(d, profile.id, now);
        const override = languageOverrides[row.full_name];
        if (row.primary_language === null && override && override in LINGUIST_COLORS) {
          row.primary_language = override;
        }
        row.readme_md = readmes[i];
        row.readme_fetched_at = now.toISOString();
        return row;
      });

      // Filtro básico de contenido (S-01): el repo marcado se rechaza entero.
      const bloqueado = rows.find((row) => repoBlockedTerm(row) !== null);
      if (bloqueado) {
        return fallo(
          `"${bloqueado.full_name}" can't be imported: it doesn't meet the content policy.`,
        );
      }

      await importOwnedRepos(db, rows, profile.id);
    }

    await removeOwnedRepos(db, profile.id, diff.toRemove.map((row) => row.github_repo_id));

    // Overrides sobre repos ya importados sin lenguaje: no exigen re-import.
    for (const row of current) {
      const override = languageOverrides[row.full_name];
      if (row.primary_language === null && override && override in LINGUIST_COLORS) {
        await db.from("repos").update({ primary_language: override })
          .eq("github_repo_id", row.github_repo_id).eq("owner_profile_id", profile.id);
      }
    }

    // Guardar la selección completa el onboarding, venga de donde venga.
    await db.from("profiles").update({ onboarded_at: new Date().toISOString() })
      .eq("id", profile.id).is("onboarded_at", null);

    revalidatePath("/");
    revalidatePath("/settings/repos");
    return { ok: true, added: diff.toAdd.length, removed: diff.toRemove.length, error: null };
  } catch (error) {
    if (error instanceof SelectionLimitError) return fallo(error.message);
    if (error instanceof RepoOwnedByAnotherProfileError) return fallo(error.message);
    console.error("[saveSelectionAction]", error);
    return fallo("We couldn't save your selection. Please try again.");
  }
}
