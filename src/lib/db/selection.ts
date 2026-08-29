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

/** Intento de importar un repo que ya pertenece a otro perfil de Snapstack. */
export class RepoOwnedByAnotherProfileError extends Error {
  constructor(fullName: string) {
    super(`"${fullName}" is already on another dev's profile`);
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
 * Importa repos a la selección de un perfil. Un repo que existía como semilla
 * (sin dueño) se reclama; uno quitado antes vuelve a `active`.
 *
 * **Nunca roba una fila que ya pertenece a otro perfil.** El upsert plano sí lo
 * hacía: sobreescribe la fila entera, `owner_profile_id` incluido, así que
 * bastaba con pedir el `full_name` de otro para quedarse su repo. Aquí la
 * propiedad se comprueba antes y, además, el UPDATE lleva el dueño permitido en
 * su propio filtro (la condición la aplica la base de datos, no esta función).
 */
export async function importOwnedRepos(db: Db, rows: RepoRow[], profileId: string): Promise<void> {
  if (rows.length === 0) return;

  const { data, error: readError } = await db
    .from("repos")
    .select("github_repo_id, owner_profile_id")
    .in("github_repo_id", rows.map((row) => row.github_repo_id));
  if (readError) throw new Error(`Error al comprobar la propiedad de los repos: ${readError.message}`);

  const existingOwners = new Map(
    ((data ?? []) as Array<{ github_repo_id: number; owner_profile_id: string | null }>).map(
      (row) => [row.github_repo_id, row.owner_profile_id],
    ),
  );

  for (const row of rows) {
    const owner = existingOwners.get(row.github_repo_id);
    if (owner != null && owner !== profileId) {
      throw new RepoOwnedByAnotherProfileError(row.full_name);
    }
  }

  const nuevos = rows.filter((row) => !existingOwners.has(row.github_repo_id));
  const existentes = rows.filter((row) => existingOwners.has(row.github_repo_id));

  if (nuevos.length > 0) {
    // Sin upsert: si otro perfil insertara el mismo repo entre la comprobación y
    // esta línea, la restricción única falla — que es el resultado correcto.
    const { error } = await db.from("repos").insert(nuevos);
    if (error) throw new Error(`Error al importar repos: ${error.message}`);
  }

  for (const row of existentes) {
    const { error } = await db
      .from("repos")
      .update(row)
      .eq("github_repo_id", row.github_repo_id)
      .or(`owner_profile_id.is.null,owner_profile_id.eq.${profileId}`);
    if (error) throw new Error(`Error al importar repos: ${error.message}`);
  }
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
