import type { Db } from "./client";

/** Fila de la tabla `repos` (ver docs/data-model.md y supabase/migrations/001_repos.sql). */
export interface RepoRow {
  github_repo_id: number;
  owner_profile_id: string | null;
  full_name: string;
  description: string | null;
  url: string;
  primary_language: string | null;
  languages: Record<string, number>;
  topics: string[];
  stars: number;
  card_seed: string;
  status: "active" | "removed";
  is_seed: boolean;
  last_synced_at: string;
}

/**
 * Upsert por `github_repo_id`: los repos nuevos se insertan, los existentes se
 * refrescan (stars, descripción, last_synced_at). Ejecutar el seed dos veces no
 * duplica filas.
 */
export async function upsertRepos(db: Db, rows: RepoRow[]): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await db.from("repos").upsert(rows, { onConflict: "github_repo_id" });
  if (error) throw new Error(`Error al upsertar repos: ${error.message}`);
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
