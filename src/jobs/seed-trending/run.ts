import type { Db } from "@/lib/db/client";
import { upsertRepos } from "@/lib/db/repos";
import { repoBlockedTerm } from "@/lib/moderation/moderation";
import { fetchTrendingRepos, type FetchTrendingOptions } from "./github-search";
import { mapSearchItemToRepoRow } from "./map";

export interface SeedTrendingResult {
  imported: number;
  repos: string[];
  /** Descartados por el filtro básico de contenido (S-01). */
  discarded: number;
}

export interface SeedTrendingOptions extends FetchTrendingOptions {
  db: Db;
}

/**
 * Importa los repos trending como semilla (M-10). Idempotente: el upsert por
 * `github_repo_id` hace que re-ejecutarlo refresque en lugar de duplicar.
 */
export async function runSeedTrending(options: SeedTrendingOptions): Promise<SeedTrendingResult> {
  const { db, now = new Date(), ...fetchOptions } = options;

  const items = await fetchTrendingRepos({ ...fetchOptions, now });
  const mapped = items.map((item) => mapSearchItemToRepoRow(item, now));
  // Filtro básico de contenido (S-01): lo marcado no entra al feed.
  const rows = mapped.filter((row) => repoBlockedTerm(row) === null);
  await upsertRepos(db, rows);

  return {
    imported: rows.length,
    repos: rows.map((row) => row.full_name),
    discarded: mapped.length - rows.length,
  };
}
