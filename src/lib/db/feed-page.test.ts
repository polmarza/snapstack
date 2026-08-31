import { describe, it, expect } from "vitest";
import type { Db } from "./client";
import { cardSeed } from "@/lib/card-seed";
import {
  annotateFollowed,
  compareFeedItems,
  decodeCursor,
  encodeCursor,
  FEED_PAGE_SIZE,
  listFeedPage,
  pageFromItems,
  type FeedCursor,
  type FeedItem,
  type FeedNote,
  type FeedRepo,
} from "./feed-page";

/** Instante con el formato que devuelve PostgREST (offset explícito). */
const at = (segundo: number) =>
  `2026-08-29T12:00:${String(segundo).padStart(2, "0")}.000000+00:00`;

const uuid = (prefijo: string, n: number) =>
  `${prefijo}-0000-0000-0000-${String(n).padStart(12, "0")}`;

const repo = (n: number, owner: string | null = null): FeedRepo =>
  ({
    id: uuid("00000000", n),
    github_repo_id: n,
    owner_profile_id: owner,
    owner_login: "dev",
    owner_avatar_url: null,
    full_name: `dev/repo-${n}`,
    description: null,
    url: `https://github.com/dev/repo-${n}`,
    primary_language: "TypeScript",
    languages: {},
    topics: [],
    stars: n,
    card_seed: cardSeed(`dev/repo-${n}`),
    status: "active",
    is_seed: true,
    imported_at: at(n),
    last_synced_at: at(n),
  }) as FeedRepo;

const note = (n: number, author = "autor-1"): FeedNote =>
  ({
    id: uuid("11111111", n),
    author_profile_id: author,
    repo_id: uuid("00000000", 1),
    body: `nota ${n}`,
    created_at: at(n),
    author: { username: "dev", display_name: null, avatar_url: null },
    repo: { id: uuid("00000000", 1), full_name: "dev/repo-1", primary_language: "TypeScript", github_repo_id: 1 },
  }) as FeedNote;

/**
 * Db falsa con la semántica de las dos consultas reales: mismo orden
 * `(instante, id)` descendente, mismo keyset y mismos filtros.
 */
function fakeDb(repos: FeedRepo[], notes: FeedNote[]) {
  const db = {
    from: (table: string) => {
      const esRepo = table === "repos";
      const campo = esRepo ? "imported_at" : "created_at";
      const instante = (row: FeedRepo | FeedNote) =>
        esRepo ? (row as FeedRepo).imported_at : (row as FeedNote).created_at;

      let rows: Array<FeedRepo | FeedNote> = [...(esRepo ? repos : notes)].sort((a, b) => {
        const ia = instante(a);
        const ib = instante(b);
        if (ia !== ib) return ia < ib ? 1 : -1;
        return a.id < b.id ? 1 : -1;
      });
      let limit: number | null = null;

      const query = {
        select: () => query,
        eq: (col: string, value: string) => {
          // `repo.status` filtra por el repo embebido; en la falsa todos activos.
          if (col === "status") rows = rows.filter((r) => (r as FeedRepo).status === value);
          return query;
        },
        in: (col: string, values: string[]) => {
          rows = rows.filter((r) =>
            col === "owner_profile_id"
              ? values.includes(String((r as FeedRepo).owner_profile_id))
              : values.includes(String((r as FeedNote).author_profile_id)),
          );
          return query;
        },
        order: () => query,
        limit: (n: number) => {
          limit = n;
          return query;
        },
        or: (expr: string) => {
          const re = new RegExp(`${campo}\\.lt\\.([^,]+),and\\(${campo}\\.eq\\.([^,]+),id\\.lt\\.(.+)\\)`);
          const m = expr.match(re);
          if (m) {
            rows = rows.filter(
              (r) => instante(r) < m[1] || (instante(r) === m[2] && r.id < m[3]),
            );
          }
          return query;
        },
        then: (resolve: (v: { data: unknown[]; error: null }) => void) =>
          resolve({ data: rows.slice(0, limit ?? rows.length), error: null }),
      };
      return query;
    },
  } as unknown as Db;
  return db;
}

describe("cursor", () => {
  const legitimo: FeedCursor = {
    t: "2026-08-29T12:00:03.123456+00:00",
    id: "123e4567-e89b-42d3-a456-426614174000",
  };

  it("codifica y decodifica ida y vuelta", () => {
    expect(decodeCursor(encodeCursor(legitimo))).toEqual(legitimo);
  });

  it("acepta las variantes de instante que emite Postgres", () => {
    for (const t of [
      "2026-08-29T12:00:03+00:00",
      "2026-08-29T12:00:03.1+00:00",
      "2026-08-29T12:00:03.123456+00:00",
      "2026-08-29T12:00:03.000Z",
    ]) {
      expect(decodeCursor(encodeCursor({ ...legitimo, t }))).not.toBeNull();
    }
  });

  it("un cursor ausente, corrupto o del formato barajado anterior vuelve al principio", () => {
    expect(decodeCursor(null)).toBeNull();
    expect(decodeCursor("")).toBeNull();
    expect(decodeCursor("no-es-base64-json")).toBeNull();
    expect(decodeCursor(Buffer.from('{"x":1}').toString("base64url"))).toBeNull();
    // Cursor de la versión barajada (C-11 lo sustituye): t era un card_seed.
    const barajado = { s: "80000000", t: "2fa9c01d", id: legitimo.id, w: 0 };
    expect(decodeCursor(Buffer.from(JSON.stringify(barajado)).toString("base64url"))).toBeNull();
  });

  it("seguridad: rechaza lo que no sea instante y uuid — acaban en el filtro de la consulta", () => {
    const token = (patch: Record<string, unknown>) =>
      Buffer.from(JSON.stringify({ ...legitimo, ...patch }), "utf8").toString("base64url");

    // Intento de romper el `or=(...)` de PostgREST con comas y paréntesis.
    expect(decodeCursor(token({ t: "2026-08-29T12:00:03+00:00),status.eq.removed" }))).toBeNull();
    expect(decodeCursor(token({ id: "abc),status.eq.removed,(id.lt.x" }))).toBeNull();
    // Formatos simplemente inesperados.
    expect(decodeCursor(token({ t: "ayer" }))).toBeNull();
    expect(decodeCursor(token({ t: "2026-08-29" }))).toBeNull();
    expect(decodeCursor(token({ id: "no-soy-un-uuid" }))).toBeNull();
    // El cursor legítimo sigue pasando.
    expect(decodeCursor(token({}))).toEqual(legitimo);
  });
});

describe("orden del feed", () => {
  const item = (kind: "repo" | "note", segundo: number, id: string): FeedItem =>
    kind === "repo"
      ? { kind, at: at(segundo), id, repo: repo(segundo) }
      : { kind, at: at(segundo), id, note: note(segundo) };

  it("ordena por instante descendente, mezclando los dos tipos", () => {
    const items = [
      item("repo", 1, uuid("00000000", 1)),
      item("note", 3, uuid("11111111", 3)),
      item("repo", 2, uuid("00000000", 2)),
    ];
    const page = pageFromItems(items, 10);
    expect(page.items.map((i) => i.at)).toEqual([at(3), at(2), at(1)]);
    expect(page.items[0].kind).toBe("note");
  });

  it("a igualdad de instante desempata por id, y el desempate es total entre tablas", () => {
    const a = item("repo", 5, uuid("00000000", 9));
    const b = item("note", 5, uuid("11111111", 9));
    expect(compareFeedItems(a, b)).toBeGreaterThan(0); // "1111..." va antes que "0000..."
    expect(pageFromItems([a, b], 10).items.map((i) => i.id)).toEqual([b.id, a.id]);
  });

  it("con más de limit ítems sirve limit y el cursor apunta al último servido", () => {
    const items = [1, 2, 3].map((n) => item("repo", n, uuid("00000000", n)));
    const page = pageFromItems(items, 2);
    expect(page.items).toHaveLength(2);
    expect(decodeCursor(page.nextCursor)).toEqual({ t: at(2), id: uuid("00000000", 2) });
  });

  it("sin más contenido, el cursor es null: el fin del feed es explícito", () => {
    expect(pageFromItems([item("repo", 1, uuid("00000000", 1))], 2).nextCursor).toBeNull();
    expect(pageFromItems([], 2).nextCursor).toBeNull();
  });
});

describe("listFeedPage", () => {
  const repos = Array.from({ length: 12 }, (_, i) => repo(i + 1, "autor-1"));
  const notes = [note(20), note(21), note(22)];

  it("el feed mezcla notas y fichas por recencia", async () => {
    const page = await listFeedPage(fakeDb(repos, notes), null, FEED_PAGE_SIZE);
    // Las notas son lo más reciente (segundos 20-22), así que abren el feed.
    expect(page.items.slice(0, 3).map((i) => i.kind)).toEqual(["note", "note", "note"]);
    expect(page.items[0].at).toBe(at(22));
    expect(page.items).toHaveLength(FEED_PAGE_SIZE);
  });

  it("paginar recorre el feed entero sin repetir ni saltarse nada", async () => {
    const db = fakeDb(repos, notes);
    const vistos: string[] = [];
    let cursor: string | null = null;
    for (let i = 0; i < 10; i++) {
      const page: Awaited<ReturnType<typeof listFeedPage>> = await listFeedPage(
        db,
        cursor,
        FEED_PAGE_SIZE,
      );
      vistos.push(...page.items.map((item) => item.id));
      cursor = page.nextCursor;
      if (!cursor) break;
    }
    expect(cursor).toBeNull();
    expect(new Set(vistos).size).toBe(vistos.length); // sin repetidos
    expect(vistos).toHaveLength(repos.length + notes.length); // sin saltos
  });

  it("el filtro Following restringe las dos tablas, no solo las fichas", async () => {
    const db = fakeDb(
      [repo(1, "autor-1"), repo(2, "autor-2")],
      [note(30, "autor-1"), note(31, "autor-2")],
    );
    const page = await listFeedPage(db, null, 10, { ownerIn: ["autor-1"] });
    expect(page.items).toHaveLength(2);
    expect(page.items.every((i) => (i.kind === "repo" ? i.repo.owner_profile_id : i.note.author_profile_id) === "autor-1")).toBe(true);
  });

  it("sin seguidos devuelve el vacío explícito sin tocar la base", async () => {
    const db = { from: () => { throw new Error("no debería consultar"); } } as unknown as Db;
    const page = await listFeedPage(db, null, 10, { ownerIn: [] });
    expect(page).toEqual({ items: [], nextCursor: null });
  });
});

describe("annotateFollowed", () => {
  it("marca fichas y notas, y deja lo propio sin anotar", () => {
    const page = {
      items: [
        { kind: "repo", at: at(1), id: uuid("00000000", 1), repo: repo(1, "otro") },
        { kind: "repo", at: at(2), id: uuid("00000000", 2), repo: repo(2, "yo") },
        { kind: "note", at: at(3), id: uuid("11111111", 3), note: note(3, "otro") },
        { kind: "note", at: at(4), id: uuid("11111111", 4), note: note(4, "yo") },
      ] as FeedItem[],
      nextCursor: null,
    };
    const anotada = annotateFollowed(page, new Set(["otro"]), "yo");
    expect((anotada.items[0] as Extract<FeedItem, { kind: "repo" }>).repo.owner_followed).toBe(true);
    expect((anotada.items[1] as Extract<FeedItem, { kind: "repo" }>).repo.owner_followed).toBeUndefined();
    expect((anotada.items[2] as Extract<FeedItem, { kind: "note" }>).note.author_followed).toBe(true);
    expect((anotada.items[3] as Extract<FeedItem, { kind: "note" }>).note.author_followed).toBeUndefined();
  });
});
