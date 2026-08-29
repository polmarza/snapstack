import type { Db } from "./client";

/** Fila de la tabla `repos` (ver docs/data-model.md y supabase/migrations/001_repos.sql). */
export interface RepoRow {
  github_repo_id: number;
  owner_profile_id: string | null;
  owner_login: string | null;
  owner_avatar_url: string | null;
  full_name: string;
  description: string | null;
  url: string;
  primary_language: string | null;
  languages: Record<string, number>;
  topics: string[];
  stars: number;
  /** Clicks hacia el repo (señales `click_repo`), desnormalizado. Ver migración 007. */
  click_count?: number;
  card_seed: string;
  status: "active" | "removed";
  is_seed: boolean;
  last_synced_at: string;
  /** README cacheado para la página de detalle (C-05, migración 011). */
  readme_md?: string | null;
  readme_fetched_at?: string | null;
}

/**
 * Upsert de repos **semilla** por `github_repo_id`: inserta los nuevos y refresca
 * los que ya eran semilla. Ejecutarlo dos veces no duplica filas.
 *
 * Deja intactos los repos que ya tienen dueño: si un repo curado por un usuario
 * aparece en trending, el seed no debe devolverlo a semilla y quitárselo de su
 * perfil. Los devuelve como `skipped` para que el script lo pueda contar.
 */
export async function upsertRepos(db: Db, rows: RepoRow[]): Promise<{ skipped: number }> {
  if (rows.length === 0) return { skipped: 0 };

  const { data, error: readError } = await db
    .from("repos")
    .select("github_repo_id, owner_profile_id")
    .in("github_repo_id", rows.map((row) => row.github_repo_id));
  if (readError) throw new Error(`Error al comprobar repos existentes: ${readError.message}`);

  const conDueno = new Set(
    ((data ?? []) as Array<{ github_repo_id: number; owner_profile_id: string | null }>)
      .filter((row) => row.owner_profile_id != null)
      .map((row) => row.github_repo_id),
  );

  const aEscribir = rows.filter((row) => !conDueno.has(row.github_repo_id));
  if (aEscribir.length > 0) {
    const { error } = await db.from("repos").upsert(aEscribir, { onConflict: "github_repo_id" });
    if (error) throw new Error(`Error al upsertar repos: ${error.message}`);
  }

  return { skipped: conDueno.size };
}

export async function listActiveRepos(db: Db, limit = 50): Promise<RepoRow[]> {
  const { data, error } = await db
    .from("repos")
    .select("*")
    .eq("status", "active")
    .order("imported_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Error al listar repos: ${error.message}`);
  return (data ?? []) as RepoRow[];
}

/**
 * Repo activo por su full_name, para la página de detalle (C-05). La búsqueda
 * es case-insensitive (GitHub trata los nombres así en URLs); los comodines de
 * LIKE se escapan porque owner/name llegan de la URL.
 */
export async function getActiveRepoByFullName(
  db: Db,
  owner: string,
  name: string,
): Promise<(RepoRow & { id: string }) | null> {
  const escape = (s: string) => s.replace(/[\\%_]/g, (m) => `\\${m}`);
  const { data, error } = await db
    .from("repos")
    .select("*")
    .ilike("full_name", `${escape(owner)}/${escape(name)}`)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw new Error(`Error al leer el repo: ${error.message}`);
  return (data as (RepoRow & { id: string }) | null) ?? null;
}
