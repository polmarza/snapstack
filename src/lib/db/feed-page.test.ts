import { describe, it, expect } from "vitest";
import type { Db } from "./client";
import {
  encodeCursor,
  decodeCursor,
  pageFromRows,
  listFeedPage,
  FEED_PAGE_SIZE,
  type FeedRepo,
} from "./feed-page";

const repo = (n: number): FeedRepo =>
  ({
    id: `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`,
    github_repo_id: n,
    owner_profile_id: null,
    owner_login: "dev",
    owner_avatar_url: null,
    full_name: `dev/repo-${n}`,
    description: null,
    url: `https://github.com/dev/repo-${n}`,
    primary_language: "TypeScript",
    languages: {},
    topics: [],
    stars: n,
    card_seed: "deadbeef",
    status: "active",
    is_seed: true,
    imported_at: new Date(Date.UTC(2026, 7, 29, 12, 0, n)).toISOString(),
    last_synced_at: new Date(Date.UTC(2026, 7, 29, 12, 0, n)).toISOString(),
  }) as FeedRepo;

/** Db falsa con la misma semántica keyset que la consulta real. */
function fakeDb(all: FeedRepo[]) {
  const calls: { or: string | null; limit: number | null } = { or: null, limit: null };
  const db = {
    from: () => {
      let rows = [...all].sort((a, b) =>
        b.imported_at === a.imported_at
          ? b.id.localeCompare(a.id)
          : b.imported_at.localeCompare(a.imported_at),
      );
      const query = {
        select: () => query,
        eq: (_col: string, value: string) => {
          rows = rows.filter((r) => r.status === value);
          return query;
        },
        order: () => query,
        limit: (n: number) => {
          calls.limit = n;
          return query;
        },
        or: (expr: string) => {
          calls.or = expr;
          const m = expr.match(/imported_at\.lt\.([^,]+),and\(imported_at\.eq\.([^,]+),id\.lt\.(.+)\)/);
          if (m) {
            rows = rows.filter(
              (r) => r.imported_at < m[1] || (r.imported_at === m[2] && r.id < m[3]),
            );
          }
          return query;
        },
        then: (resolve: (v: { data: FeedRepo[]; error: null }) => void) =>
          resolve({ data: rows.slice(0, calls.limit ?? rows.length), error: null }),
      };
      return query;
    },
  } as unknown as Db;
  return { db, calls };
}

describe("cursor", () => {
  it("M-06: codifica y decodifica ida y vuelta", () => {
    const cursor = { t: "2026-08-29T12:00:00.000Z", id: "abc" };
    expect(decodeCursor(encodeCursor(cursor))).toEqual(cursor);
  });

  it("M-06: un cursor ausente o corrupto vuelve al principio en vez de romper", () => {
    expect(decodeCursor(null)).toBeNull();
    expect(decodeCursor("")).toBeNull();
    expect(decodeCursor("no-es-base64-json")).toBeNull();
    expect(decodeCursor(Buffer.from('{"x":1}').toString("base64url"))).toBeNull();
  });
});

describe("pageFromRows", () => {
  it("M-06: con limit+1 filas sirve limit y devuelve cursor", () => {
    const rows = [repo(3), repo(2), repo(1)];
    const page = pageFromRows(rows, 2);
    expect(page.repos).toHaveLength(2);
    expect(page.nextCursor).not.toBeNull();
    expect(decodeCursor(page.nextCursor)).toEqual({ t: repo(2).imported_at, id: repo(2).id });
  });

  it("M-06: la última página parcial devuelve cursor nulo — fin de feed explícito", () => {
    expect(pageFromRows([repo(1)], 2).nextCursor).toBeNull();
    expect(pageFromRows([], 2).nextCursor).toBeNull();
  });
});

describe("listFeedPage", () => {
  const all = Array.from({ length: 25 }, (_, i) => repo(i + 1));

  it("M-06: sirve la primera página en orden cronológico descendente", async () => {
    const { db, calls } = fakeDb(all);
    const page = await listFeedPage(db);
    expect(page.repos.map((r) => r.github_repo_id)).toEqual([25, 24, 23, 22, 21, 20, 19, 18, 17, 16]);
    expect(calls.limit).toBe(FEED_PAGE_SIZE + 1);
    expect(page.nextCursor).not.toBeNull();
  });

  it("M-06: las páginas encadenadas no duplican ni saltan fichas", async () => {
    const { db } = fakeDb(all);
    const vistos: number[] = [];
    let cursor: string | null = null;
    let vueltas = 0;
    do {
      const page = await listFeedPage(fakeDb(all).db, cursor);
      vistos.push(...page.repos.map((r) => Number(r.github_repo_id)));
      cursor = page.nextCursor;
      vueltas++;
    } while (cursor && vueltas < 10);

    expect(vistos).toHaveLength(25);
    expect(new Set(vistos).size).toBe(25);
    expect(vistos[0]).toBe(25);
    expect(vistos.at(-1)).toBe(1);
    void db;
  });

  it("M-06: una fila nueva insertada entre páginas no desplaza las siguientes (keyset, no offset)", async () => {
    const primera = await listFeedPage(fakeDb(all).db);
    // Entra un repo nuevo (más reciente) después de servir la primera página.
    const conNuevo = [...all, repo(99)];
    const segunda = await listFeedPage(fakeDb(conNuevo).db, primera.nextCursor);
    expect(segunda.repos.map((r) => Number(r.github_repo_id))).toEqual([15, 14, 13, 12, 11, 10, 9, 8, 7, 6]);
  });

  it("M-06: solo sirve repos activos", async () => {
    const conRemoved = [...all];
    conRemoved[0] = { ...conRemoved[0], status: "removed" };
    const page = await listFeedPage(fakeDb(conRemoved).db);
    expect(page.repos.map((r) => Number(r.github_repo_id))).not.toContain(1);
  });
});
