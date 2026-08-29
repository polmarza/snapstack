import { describe, it, expect } from "vitest";
import type { Db } from "./client";
import { setFollowing, listFollowedIds, SelfFollowError } from "./follows";
import { listFeedPage, type FeedRepo } from "./feed-page";

/** Db falsa de follows: upsert con dedupe y delete por par. */
function fakeFollowsDb() {
  const pares = new Set<string>();
  const db = {
    from: (table: string) => ({
      upsert: (row: { follower_id: string; followed_id: string }, opts: Record<string, unknown>) => {
        expect(table).toBe("follows");
        expect(opts).toMatchObject({ onConflict: "follower_id,followed_id", ignoreDuplicates: true });
        pares.add(`${row.follower_id}→${row.followed_id}`);
        return Promise.resolve({ error: null });
      },
      delete: () => ({
        eq: (_c1: string, follower: string) => ({
          eq: (_c2: string, followed: string) => {
            pares.delete(`${follower}→${followed}`);
            return Promise.resolve({ error: null });
          },
        }),
      }),
      select: () => ({
        eq: (_c: string, follower: string) =>
          Promise.resolve({
            data: [...pares]
              .filter((p) => p.startsWith(`${follower}→`))
              .map((p) => ({ followed_id: p.split("→")[1] })),
            error: null,
          }),
      }),
    }),
  } as unknown as Db;
  return { db, pares };
}

describe("setFollowing", () => {
  it("M-07: seguir y dejar de seguir es un toggle idempotente", async () => {
    const { db, pares } = fakeFollowsDb();

    await setFollowing(db, "pol", "otra", true);
    await setFollowing(db, "pol", "otra", true); // repetir no duplica
    expect(pares.size).toBe(1);

    await setFollowing(db, "pol", "otra", false);
    expect(pares.size).toBe(0);
    await setFollowing(db, "pol", "otra", false); // repetir no falla
    expect(pares.size).toBe(0);
  });

  it("M-07: nadie puede seguirse a sí mismo", async () => {
    const { db } = fakeFollowsDb();
    await expect(setFollowing(db, "pol", "pol", true)).rejects.toThrow(SelfFollowError);
  });

  it("M-07: listFollowedIds devuelve solo los seguidos del follower", async () => {
    const { db } = fakeFollowsDb();
    await setFollowing(db, "pol", "a", true);
    await setFollowing(db, "pol", "b", true);
    await setFollowing(db, "otra", "c", true);
    expect((await listFollowedIds(db, "pol")).sort()).toEqual(["a", "b"]);
  });
});

describe("listFeedPage con filtro Following", () => {
  const repo = (n: number, owner: string | null): FeedRepo =>
    ({
      id: `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`,
      github_repo_id: n,
      owner_profile_id: owner,
      owner_login: owner,
      owner_avatar_url: null,
      full_name: `dev/repo-${n}`,
      description: null,
      url: "",
      primary_language: null,
      languages: {},
      topics: [],
      stars: 0,
      card_seed: "deadbeef",
      status: "active",
      is_seed: owner === null,
      imported_at: new Date(Date.UTC(2026, 7, 29, 12, 0, n)).toISOString(),
      last_synced_at: "",
    }) as FeedRepo;

  function fakeFeedDb(all: FeedRepo[]) {
    return {
      from: () => {
        let rows = [...all].sort((a, b) => b.imported_at.localeCompare(a.imported_at));
        let limit = rows.length;
        const query = {
          select: () => query,
          eq: (_c: string, v: string) => {
            rows = rows.filter((r) => r.status === v);
            return query;
          },
          in: (_c: string, ids: string[]) => {
            rows = rows.filter((r) => r.owner_profile_id !== null && ids.includes(r.owner_profile_id));
            return query;
          },
          order: () => query,
          limit: (n: number) => {
            limit = n;
            return query;
          },
          or: () => query,
          then: (resolve: (v: { data: FeedRepo[]; error: null }) => void) =>
            resolve({ data: rows.slice(0, limit), error: null }),
        };
        return query;
      },
    } as unknown as Db;
  }

  const all = [repo(1, null), repo(2, "a"), repo(3, "b"), repo(4, "a")];

  it("M-07: el filtro restringe a repos de los dueños seguidos", async () => {
    const page = await listFeedPage(fakeFeedDb(all), null, 10, { ownerIn: ["a"] });
    expect(page.repos.map((r) => Number(r.github_repo_id))).toEqual([4, 2]);
  });

  it("M-07: sin seguidos, vacío explícito sin tocar la base", async () => {
    const db = { from: () => { throw new Error("no debería consultarse"); } } as unknown as Db;
    const page = await listFeedPage(db, null, 10, { ownerIn: [] });
    expect(page).toEqual({ repos: [], nextCursor: null });
  });
});
