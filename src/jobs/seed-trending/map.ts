import { cardSeed } from "@/lib/card-seed";
import type { RepoRow } from "@/lib/db/repos";
import type { SearchRepoItem } from "./github-search";

/**
 * Respuesta de la Search API → fila de `repos`. Los repos semilla van sin dueño
 * (`owner_profile_id: null`, `is_seed: true`): distinguibles siempre de los
 * reclamados por un usuario (M-10).
 *
 * `languages` queda vacío a propósito: el desglose por bytes llega por GraphQL con
 * la GitHub App (M-02/M-08); la Search API solo da el lenguaje dominante.
 */
export function mapSearchItemToRepoRow(item: SearchRepoItem, now: Date): RepoRow {
  return {
    github_repo_id: item.id,
    owner_profile_id: null,
    full_name: item.full_name,
    description: item.description,
    url: item.html_url,
    primary_language: item.language,
    languages: {},
    topics: item.topics ?? [],
    stars: item.stargazers_count,
    card_seed: cardSeed(String(item.id)),
    status: "active",
    is_seed: true,
    last_synced_at: now.toISOString(),
  };
}
