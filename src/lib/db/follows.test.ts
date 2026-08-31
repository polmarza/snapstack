import { describe, it, expect } from "vitest";
import type { Db } from "./client";
import { setFollowing, listFollowedIds, getFollowCounts, SelfFollowError } from "./follows";

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

/**
 * El filtro Following del feed (M-07) se testea en `feed-page.test.ts`: desde
 * C-11 restringe dos tablas (repos y notas) y la Db falsa de aquí solo sabía de
 * una. Las dos aserciones que vivían en este archivo —solo aparecen los repos
 * de los seguidos, y sin seguidos el vacío es explícito sin tocar la base—
 * siguen existiendo allí, ampliadas a las notas.
 */

/** Db falsa de counts: select head+count filtrado por columna. */
function fakeCountsDb(rows: Array<{ follower_id: string; followed_id: string }>) {
  return {
    from: (table: string) => ({
      select: (_cols: string, opts: { count: string; head: boolean }) => {
        expect(table).toBe("follows");
        expect(opts).toMatchObject({ count: "exact", head: true });
        return {
          eq: (col: "follower_id" | "followed_id", value: string) =>
            Promise.resolve({
              count: rows.filter((row) => row[col] === value).length,
              error: null,
            }),
        };
      },
    }),
  } as unknown as Db;
}

describe("getFollowCounts", () => {
  it("separa followers (le siguen) de following (a los que sigue)", async () => {
    const db = fakeCountsDb([
      { follower_id: "pol", followed_id: "a" },
      { follower_id: "pol", followed_id: "b" },
      { follower_id: "c", followed_id: "pol" },
    ]);
    expect(await getFollowCounts(db, "pol")).toEqual({ followers: 1, following: 2 });
  });

  it("un perfil sin follows devuelve ceros, no null", async () => {
    const db = fakeCountsDb([]);
    expect(await getFollowCounts(db, "nadie")).toEqual({ followers: 0, following: 0 });
  });
});
