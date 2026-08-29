import { describe, it, expect, vi } from "vitest";
import { cardSeed } from "@/lib/card-seed";
import { listPublicRepos, fetchRepoDetails, mapRepoDetailsToRow, type RepoDetails } from "./user-repos";

const gql = (data: unknown) =>
  new Response(JSON.stringify({ data }), { status: 200 });

const detalles = (extra: Partial<RepoDetails> = {}): RepoDetails => ({
  databaseId: 4164482,
  nameWithOwner: "polmarza/snapstack",
  description: "Perfil curado + feed visual",
  url: "https://github.com/polmarza/snapstack",
  stargazerCount: 12,
  owner: { login: "polmarza", avatarUrl: "https://avatars.githubusercontent.com/u/1" },
  languages: {
    edges: [
      { size: 9000, node: { name: "TypeScript" } },
      { size: 500, node: { name: "CSS" } },
    ],
  },
  repositoryTopics: { nodes: [{ topic: { name: "nextjs" } }, { topic: { name: "feed" } }] },
  ...extra,
});

describe("listPublicRepos", () => {
  it("M-02: lista los repos públicos propios descartando archivados", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      gql({
        viewer: {
          repositories: {
            nodes: [
              { databaseId: 1, nameWithOwner: "p/uno", name: "uno", description: "d", stargazerCount: 3, isArchived: false, primaryLanguage: { name: "Go" } },
              { databaseId: 2, nameWithOwner: "p/viejo", name: "viejo", description: null, stargazerCount: 0, isArchived: true, primaryLanguage: null },
            ],
          },
        },
      }),
    );
    const items = await listPublicRepos("token-x", fetchImpl);
    expect(items).toEqual([
      { githubRepoId: 1, fullName: "p/uno", name: "uno", description: "d", primaryLanguage: "Go", stars: 3 },
    ]);
    // La query pide solo públicos, sin forks, del propio usuario.
    const body = JSON.parse(fetchImpl.mock.calls[0][1].body as string);
    expect(body.query).toContain("privacy: PUBLIC");
    expect(body.query).toContain("isFork: false");
    expect(body.query).toContain("ownerAffiliations: [OWNER]");
  });

  it("M-02: un error de la API se propaga legible", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("x", { status: 401, statusText: "Unauthorized" }));
    await expect(listPublicRepos("token-x", fetchImpl)).rejects.toThrow("401");
  });
});

describe("fetchRepoDetails", () => {
  it("M-02: pide el repo por owner y nombre", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(gql({ repository: detalles() }));
    const details = await fetchRepoDetails("token-x", "polmarza/snapstack", fetchImpl);
    expect(details.databaseId).toBe(4164482);
    const body = JSON.parse(fetchImpl.mock.calls[0][1].body as string);
    expect(body.variables).toEqual({ owner: "polmarza", name: "snapstack" });
  });

  it("M-02: repo inexistente lanza error", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(gql({ repository: null }));
    await expect(fetchRepoDetails("token-x", "p/no-existe", fetchImpl)).rejects.toThrow("no existe");
  });
});

describe("mapRepoDetailsToRow", () => {
  const AHORA = new Date("2026-08-29T12:00:00Z");

  it("M-02: mapea con dueño e is_seed = false", () => {
    const row = mapRepoDetailsToRow(detalles(), "profile-uuid", AHORA);
    expect(row.owner_profile_id).toBe("profile-uuid");
    expect(row.is_seed).toBe(false);
    expect(row.status).toBe("active");
    expect(row.owner_login).toBe("polmarza");
    expect(row.full_name).toBe("polmarza/snapstack");
  });

  it("M-02: languages queda como desglose por bytes y el dominante es el mayor", () => {
    const row = mapRepoDetailsToRow(detalles(), "p", AHORA);
    expect(row.languages).toEqual({ TypeScript: 9000, CSS: 500 });
    expect(row.primary_language).toBe("TypeScript");
    expect(row.topics).toEqual(["nextjs", "feed"]);
  });

  it("M-04/M-02: la card_seed es el hash determinista del ID", () => {
    const row = mapRepoDetailsToRow(detalles(), "p", AHORA);
    expect(row.card_seed).toBe(cardSeed("4164482"));
  });
});
