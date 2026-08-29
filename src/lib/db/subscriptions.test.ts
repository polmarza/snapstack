import { describe, it, expect } from "vitest";
import type { Db } from "./client";
import { setSubscription, isSubscribed, listSubscriberIds } from "./subscriptions";

/** Db falsa de repo_subscriptions: upsert con dedupe y delete por par. */
function fakeDb() {
  const pares = new Set<string>();
  const db = {
    from: (table: string) => {
      expect(table).toBe("repo_subscriptions");
      let filtered = [...pares];
      const query = {
        upsert: (row: { subscriber_profile_id: string; repo_id: string }, opts: Record<string, unknown>) => {
          expect(opts).toMatchObject({ onConflict: "subscriber_profile_id,repo_id", ignoreDuplicates: true });
          pares.add(`${row.subscriber_profile_id}→${row.repo_id}`);
          return Promise.resolve({ error: null });
        },
        delete: () => ({
          eq: (_c: string, sub: string) => ({
            eq: (_c2: string, repo: string) => {
              pares.delete(`${sub}→${repo}`);
              return Promise.resolve({ error: null });
            },
          }),
        }),
        select: () => query,
        eq: (col: string, v: string) => {
          filtered = filtered.filter((p) =>
            col === "subscriber_profile_id" ? p.startsWith(`${v}→`) : p.endsWith(`→${v}`),
          );
          return query;
        },
        maybeSingle: () =>
          Promise.resolve({ data: filtered.length > 0 ? { repo_id: filtered[0].split("→")[1] } : null, error: null }),
        then: (resolve: (v: { data: Array<{ subscriber_profile_id: string }>; error: null }) => void) =>
          resolve({ data: filtered.map((p) => ({ subscriber_profile_id: p.split("→")[0] })), error: null }),
      };
      return query;
    },
  } as unknown as Db;
  return { db, pares };
}

describe("setSubscription", () => {
  it("C-06: suscribir y cancelar es un toggle idempotente", async () => {
    const { db, pares } = fakeDb();
    await setSubscription(db, "pol", "repo1", true);
    await setSubscription(db, "pol", "repo1", true); // repetir no duplica
    expect(pares.size).toBe(1);
    expect(await isSubscribed(db, "pol", "repo1")).toBe(true);

    await setSubscription(db, "pol", "repo1", false);
    expect(pares.size).toBe(0);
    expect(await isSubscribed(db, "pol", "repo1")).toBe(false);
  });

  it("C-06: listSubscriberIds devuelve solo los suscritos a ese repo", async () => {
    const { db } = fakeDb();
    await setSubscription(db, "pol", "repo1", true);
    await setSubscription(db, "ana", "repo1", true);
    await setSubscription(db, "pol", "repo2", true);
    expect((await listSubscriberIds(db, "repo1")).sort()).toEqual(["ana", "pol"]);
    expect(await listSubscriberIds(db, "repo3")).toEqual([]);
  });
});
