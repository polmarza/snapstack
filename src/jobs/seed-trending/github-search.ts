/**
 * Trending vía la Search API oficial de GitHub: repos con más stars creados en los
 * últimos N días. GitHub no publica API de trending; scrapear github.com/trending
 * queda descartado (frágil y roza los términos de uso).
 */

export interface SearchRepoItem {
  id: number;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  topics?: string[];
  stargazers_count: number;
  archived: boolean;
}

interface SearchResponse {
  items: SearchRepoItem[];
}

export interface FetchTrendingOptions {
  /** Ventana de "reciente": repos creados en los últimos N días. */
  days?: number;
  /** Máximo de repos a traer (la Search API pagina a 100 por página; usamos una). */
  limit?: number;
  /** Token opcional (GITHUB_TOKEN) para subir el rate limit. Nunca se loguea. */
  token?: string;
  /** Inyectables para tests. */
  fetchImpl?: typeof fetch;
  now?: Date;
}

export async function fetchTrendingRepos(options: FetchTrendingOptions = {}): Promise<SearchRepoItem[]> {
  const { days = 30, limit = 30, token, fetchImpl = fetch, now = new Date() } = options;

  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const query = `created:>${since} stars:>10 fork:false`;
  const url = new URL("https://api.github.com/search/repositories");
  url.searchParams.set("q", query);
  url.searchParams.set("sort", "stars");
  url.searchParams.set("order", "desc");
  url.searchParams.set("per_page", String(limit));

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetchImpl(url.toString(), { headers });
  if (!res.ok) {
    throw new Error(`GitHub Search API respondió ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as SearchResponse;
  return (data.items ?? []).filter((item) => !item.archived);
}
