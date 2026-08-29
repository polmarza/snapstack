/**
 * Lógica de la selección de repos del perfil (M-02/M-03). El límite se valida
 * aquí, en servidor — la UI solo lo refleja.
 */

import type { Db } from "./client";
import type { RepoRow } from "./repos";

export function selectionLimit(): number {
  const parsed = Number(process.env.REPO_SELECTION_LIMIT ?? 5);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5;
}

export class SelectionLimitError extends Error {
  constructor(limit: number) {
    // Mensaje visible en la UI → inglés (english-first).
    super(`Your selection exceeds the limit of ${limit} repos per profile`);
  }
}

export interface SelectionDiff {
  /** full_names a importar (nuevos en la selección). */
  toAdd: string[];
  /** filas actuales que salen de la selección. */
  toRemove: RepoRow[];
  /** cuántos se quedan como están. */
  kept: number;
}

/** Diff entre la selección actual (filas activas del dueño) y la nueva (full_names). */
export function computeSelectionDiff(current: RepoRow[], selected: string[]): SelectionDiff {
  const selectedSet = new Set(selected);
  const currentNames = new Set(current.map((row) => row.full_name));
  return {
    toAdd: selected.filter((name) => !currentNames.has(name)),
    toRemove: current.filter((row) => !selectedSet.has(row.full_name)),
    kept: current.filter((row) => selectedSet.has(row.full_name)).length,
  };
}

/** Negativo de M-02: la selección resultante nunca supera el límite. */
export function validateSelectionSize(diff: SelectionDiff, limit: number): void {
  if (diff.kept + diff.toAdd.length > limit) throw new SelectionLimitError(limit);
}

export async function listOwnedActiveRepos(db: Db, profileId: string): Promise<RepoRow[]> {
  const { data, error } = await db
    .from("repos")
    .select("*")
    .eq("owner_profile_id", profileId)
    .eq("status", "active");
  if (error) throw new Error(`Error al listar la selección: ${error.message}`);
  return (data ?? []) as RepoRow[];
}

/**
 * Importa (o reactiva/reclama) por upsert sobre `github_repo_id`: un repo que ya
 * existía como semilla pasa a tener dueño; uno quitado antes vuelve a `active`.
 */
export async function importOwnedRepos(db: Db, rows: RepoRow[]): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await db.from("repos").upsert(rows, { onConflict: "github_repo_id" });
  if (error) throw new Error(`Error al importar repos: ${error.message}`);
}

/** Quitar de la selección: `status = 'removed'` — fuera de feed y perfil, sin borrar. */
export async function removeOwnedRepos(db: Db, profileId: string, githubRepoIds: number[]): Promise<void> {
  if (githubRepoIds.length === 0) return;
  const { error } = await db
    .from("repos")
    .update({ status: "removed" })
    .eq("owner_profile_id", profileId)
    .in("github_repo_id", githubRepoIds);
  if (error) throw new Error(`Error al quitar repos: ${error.message}`);
}
