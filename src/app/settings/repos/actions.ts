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
  validateSelectionSize,
} from "@/lib/db/selection";
import { getGithubToken } from "@/lib/github/token";
import { fetchRepoDetails, mapRepoDetailsToRow } from "@/lib/github/user-repos";
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
 */
export async function saveSelectionAction(selectedFullNames: string[]): Promise<SaveSelectionResult> {
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
      const rows = details.map((d) => mapRepoDetailsToRow(d, profile.id, now));

      // Filtro básico de contenido (S-01): el repo marcado se rechaza entero.
      const bloqueado = rows.find((row) => repoBlockedTerm(row) !== null);
      if (bloqueado) {
        return fallo(
          `"${bloqueado.full_name}" can't be imported: it doesn't meet the content policy.`,
        );
      }

      await importOwnedRepos(db, rows);
    }

    await removeOwnedRepos(db, profile.id, diff.toRemove.map((row) => row.github_repo_id));

    revalidatePath("/");
    revalidatePath("/settings/repos");
    return { ok: true, added: diff.toAdd.length, removed: diff.toRemove.length, error: null };
  } catch (error) {
    if (error instanceof SelectionLimitError) return fallo(error.message);
    console.error("[saveSelectionAction]", error);
    return fallo("We couldn't save your selection. Please try again.");
  }
}
