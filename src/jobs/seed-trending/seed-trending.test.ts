import { describe, it, expect, vi } from "vitest";
import { cardSeed } from "@/lib/card-seed";
import type { Db } from "@/lib/db/client";
import type { RepoRow } from "@/lib/db/repos";
import { fetchTrendingRepos, type SearchRepoItem } from "./github-search";
import { mapSearchItemToRepoRow } from "./map";
import { runSeedTrending } from "./run";

const AHORA = new Date("2026-08-29T12:00:00Z");

const item = (extra: Partial<SearchRepoItem> = {}): SearchRepoItem => ({
  id: 1296269,
  full_name: "octocat/hello-world",
  description: "My first repository",
  html_url: "https://github.com/octocat/hello-world",
  language: "TypeScript",
  topics: ["demo", "example"],
  stargazers_count: 420,
  archived: false,
  owner: { login: "octocat", avatar_url: "https://avatars.githubusercontent.com/u/583231" },
  ...extra,
});

const respuestaOk = (items: SearchRepoItem[]) =>
  new Response(JSON.stringify({ items }), { status: 200 });

/** Db falsa: upsert en memoria con la misma semántica de conflicto por github_repo_id. */
function fakeDb() {
  const store = new Map<number, RepoRow>();
  const db = {
    from: (table: string) => ({
      upsert: (rows: RepoRow[], opts: { onConflict: string }) => {
        expect(table).toBe("repos");
        expect(opts.onConflict).toBe("github_repo_id");
        for (const row of rows) store.set(row.github_repo_id, row);
        return Promise.resolve({ error: null });
      },
    }),
  } as unknown as Db;
  return { db, store };
}

describe("mapSearchItemToRepoRow", () => {
  it("M-10: marca los repos como semilla sin dueño", () => {
    const row = mapSearchItemToRepoRow(item(), AHORA);
    expect(row.is_seed).toBe(true);
    expect(row.owner_profile_id).toBeNull();
    expect(row.status).toBe("active");
  });

  it("M-10: mapea los campos de la Search API al modelo propio", () => {
    const row = mapSearchItemToRepoRow(item(), AHORA);
    expect(row.github_repo_id).toBe(1296269);
    expect(row.full_name).toBe("octocat/hello-world");
    expect(row.url).toBe("https://github.com/octocat/hello-world");
    expect(row.primary_language).toBe("TypeScript");
    expect(row.topics).toEqual(["demo", "example"]);
    expect(row.stars).toBe(420);
    expect(row.languages).toEqual({});
    expect(row.last_synced_at).toBe(AHORA.toISOString());
    expect(row.owner_login).toBe("octocat");
    expect(row.owner_avatar_url).toBe("https://avatars.githubusercontent.com/u/583231");
  });

  it("M-04/M-10: la card_seed es el hash determinista del ID del repo", () => {
    const row = mapSearchItemToRepoRow(item(), AHORA);
    expect(row.card_seed).toBe(cardSeed("1296269"));
    expect(mapSearchItemToRepoRow(item(), AHORA).card_seed).toBe(row.card_seed);
  });

  it("M-10: tolera descripción, topics y owner ausentes", () => {
    const row = mapSearchItemToRepoRow(
      item({ description: null, topics: undefined, owner: null }),
      AHORA,
    );
    expect(row.description).toBeNull();
    expect(row.topics).toEqual([]);
    expect(row.owner_login).toBeNull();
    expect(row.owner_avatar_url).toBeNull();
  });
});

describe("fetchTrendingRepos", () => {
  it("M-10: consulta la Search API con la ventana de fechas y el orden por stars", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(respuestaOk([item()]));
    await fetchTrendingRepos({ days: 30, limit: 25, now: AHORA, fetchImpl });

    const url = new URL(fetchImpl.mock.calls[0][0] as string);
    expect(url.origin + url.pathname).toBe("https://api.github.com/search/repositories");
    expect(url.searchParams.get("q")).toContain("created:>2026-07-30");
    expect(url.searchParams.get("sort")).toBe("stars");
    expect(url.searchParams.get("per_page")).toBe("25");
  });

  it("M-10: solo manda Authorization cuando hay token", async () => {
    const fetchImpl = vi.fn().mockImplementation(() => Promise.resolve(respuestaOk([])));
    await fetchTrendingRepos({ fetchImpl, now: AHORA });
    expect(fetchImpl.mock.calls[0][1].headers.Authorization).toBeUndefined();

    await fetchTrendingRepos({ fetchImpl, now: AHORA, token: "x" });
    expect(fetchImpl.mock.calls[1][1].headers.Authorization).toBe("Bearer x");
  });

  it("M-10: descarta los repos archivados", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(respuestaOk([item(), item({ id: 2, archived: true })]));
    const items = await fetchTrendingRepos({ fetchImpl, now: AHORA });
    expect(items.map((i) => i.id)).toEqual([1296269]);
  });

  it("M-10: falla con un error legible si la API responde mal", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("limit", { status: 403, statusText: "Forbidden" }));
    await expect(fetchTrendingRepos({ fetchImpl, now: AHORA })).rejects.toThrow("403");
  });
});

describe("runSeedTrending", () => {
  it("M-10: importa los repos y reporta cuántos", async () => {
    const { db, store } = fakeDb();
    const fetchImpl = vi.fn().mockResolvedValue(respuestaOk([item(), item({ id: 2, full_name: "a/b" })]));

    const result = await runSeedTrending({ db, fetchImpl, now: AHORA });

    expect(result.imported).toBe(2);
    expect(store.size).toBe(2);
    expect(result.repos).toEqual(["octocat/hello-world", "a/b"]);
  });

  it("M-10: es idempotente — dos ejecuciones no duplican y refrescan datos", async () => {
    const { db, store } = fakeDb();
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(respuestaOk([item({ stargazers_count: 100 })]))
      .mockResolvedValueOnce(respuestaOk([item({ stargazers_count: 250 })]));

    await runSeedTrending({ db, fetchImpl, now: AHORA });
    await runSeedTrending({ db, fetchImpl, now: AHORA });

    expect(store.size).toBe(1);
    expect(store.get(1296269)?.stars).toBe(250);
  });

  it("S-01: los repos que no pasan el filtro de contenido se descartan del seed", async () => {
    const { db, store } = fakeDb();
    const fetchImpl = vi.fn().mockResolvedValue(
      respuestaOk([
        item(),
        item({ id: 2, full_name: "x/mega-porn-scraper", description: null }),
      ]),
    );

    const result = await runSeedTrending({ db, fetchImpl, now: AHORA });

    expect(result.imported).toBe(1);
    expect(result.discarded).toBe(1);
    expect(store.has(2)).toBe(false);
  });

  it("M-10: si la API falla, no se escribe nada", async () => {
    const { db, store } = fakeDb();
    const fetchImpl = vi.fn().mockResolvedValue(new Response("x", { status: 500, statusText: "err" }));

    await expect(runSeedTrending({ db, fetchImpl, now: AHORA })).rejects.toThrow("500");
    expect(store.size).toBe(0);
  });
});
