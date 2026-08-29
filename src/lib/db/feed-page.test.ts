import { describe, it, expect } from "vitest";
import type { Db } from "./client";
import { cardSeed } from "@/lib/card-seed";
import {
  encodeCursor,
  decodeCursor,
  pageFromSegments,
  listFeedPage,
  FEED_PAGE_SIZE,
  type FeedCursor,
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
    // Semilla real del motor de fichas: uniforme, sin correlación con n.
    card_seed: cardSeed(`dev/repo-${n}`),
    status: "active",
    is_seed: true,
    imported_at: new Date(Date.UTC(2026, 7, 29, 12, 0, n)).toISOString(),
    last_synced_at: new Date(Date.UTC(2026, 7, 29, 12, 0, n)).toISOString(),
  }) as FeedRepo;

/** Db falsa con la misma semántica de filtros y orden que la consulta real. */
function fakeDb(all: FeedRepo[]) {
  const db = {
    from: () => {
      let rows = [...all].sort((a, b) =>
        b.card_seed === a.card_seed
          ? b.id.localeCompare(a.id)
          : b.card_seed.localeCompare(a.card_seed),
      );
      let limit: number | null = null;
      const query = {
        select: () => query,
        eq: (_col: string, value: string) => {
          rows = rows.filter((r) => r.status === value);
          return query;
        },
        lte: (_col: string, value: string) => {
          rows = rows.filter((r) => r.card_seed <= value);
          return query;
        },
        gt: (_col: string, value: string) => {
          rows = rows.filter((r) => r.card_seed > value);
          return query;
        },
        in: (_col: string, values: string[]) => {
          rows = rows.filter((r) => values.includes(String(r.owner_profile_id)));
          return query;
        },
        order: () => query,
        limit: (n: number) => {
          limit = n;
          return query;
        },
        or: (expr: string) => {
          const m = expr.match(/card_seed\.lt\.([^,]+),and\(card_seed\.eq\.([^,]+),id\.lt\.(.+)\)/);
          if (m) {
            rows = rows.filter((r) => r.card_seed < m[1] || (r.card_seed === m[2] && r.id < m[3]));
          }
          return query;
        },
        then: (resolve: (v: { data: FeedRepo[]; error: null }) => void) =>
          resolve({ data: rows.slice(0, limit ?? rows.length), error: null }),
      };
      return query;
    },
  } as unknown as Db;
  return db;
}

describe("cursor", () => {
  const legitimo: FeedCursor = {
    s: "80000000",
    t: "2fa9c01d",
    id: "123e4567-e89b-42d3-a456-426614174000",
    w: 0,
  };

  it("codifica y decodifica ida y vuelta", () => {
    expect(decodeCursor(encodeCursor(legitimo))).toEqual(legitimo);
    expect(decodeCursor(encodeCursor({ ...legitimo, w: 1 }))).toEqual({ ...legitimo, w: 1 });
  });

  it("un cursor ausente, corrupto o del formato cronológico anterior vuelve al principio", () => {
    expect(decodeCursor(null)).toBeNull();
    expect(decodeCursor("")).toBeNull();
    expect(decodeCursor("no-es-base64-json")).toBeNull();
    expect(decodeCursor(Buffer.from('{"x":1}').toString("base64url"))).toBeNull();
    // Cursor de la versión cronológica: t era una fecha ISO, sin s ni w.
    const antiguo = { t: "2026-08-29T12:00:00.000Z", id: legitimo.id };
    expect(decodeCursor(Buffer.from(JSON.stringify(antiguo)).toString("base64url"))).toBeNull();
  });

  it("seguridad: rechaza valores que no son hex-8 y uuid — acaban en el filtro de la consulta", () => {
    const token = (patch: Record<string, unknown>) =>
      Buffer.from(JSON.stringify({ ...legitimo, ...patch }), "utf8").toString("base64url");

    // Intento de romper el `or=(...)` de PostgREST con comas y paréntesis.
    expect(decodeCursor(token({ t: "abc),status.eq.removed" }))).toBeNull();
    expect(decodeCursor(token({ id: "abc),status.eq.removed,(id.lt.x" }))).toBeNull();
    // Formatos simplemente inesperados.
    expect(decodeCursor(token({ s: "ZZZZZZZZ" }))).toBeNull();
    expect(decodeCursor(token({ t: "deadbeef00" }))).toBeNull();
    expect(decodeCursor(token({ id: "no-soy-un-uuid" }))).toBeNull();
    expect(decodeCursor(token({ w: 2 }))).toBeNull();
    expect(decodeCursor(token({ w: "0" }))).toBeNull();
    // El cursor legítimo sigue pasando.
    expect(decodeCursor(token({}))).toEqual(legitimo);
  });
});

describe("pageFromSegments", () => {
  const porSeed = (a: FeedRepo, b: FeedRepo) => b.card_seed.localeCompare(a.card_seed);

  it("con limit+1 filas sirve limit y el cursor apunta al último servido, con su tramo", () => {
    const [r1, r2, r3] = [repo(1), repo(2), repo(3)].sort(porSeed);
    const page = pageFromSegments([r1, r2, r3], [], 2, "ffffffff");
    expect(page.repos).toHaveLength(2);
    expect(decodeCursor(page.nextCursor)).toEqual({ s: "ffffffff", t: r2.card_seed, id: r2.id, w: 0 });
  });

  it("cuando la fila extra viene del tramo de la vuelta, el cursor conserva w del último servido", () => {
    const [r1, r2, r3] = [repo(1), repo(2), repo(3)].sort(porSeed);
    // Dos del tramo 1 + una de la vuelta: se sirven las dos primeras, w sigue en 0.
    const page = pageFromSegments([r1, r2], [r3], 2, r2.card_seed);
    expect(page.repos.map((r) => r.id)).toEqual([r1.id, r2.id]);
    expect(decodeCursor(page.nextCursor)?.w).toBe(0);
    // Una del tramo 1 + dos de la vuelta: el último servido ya dio la vuelta.
    const page2 = pageFromSegments([r1], [r2, r3], 2, "00000001");
    expect(decodeCursor(page2.nextCursor)?.w).toBe(1);
  });

  it("la última página parcial devuelve cursor nulo — fin de feed explícito", () => {
    expect(pageFromSegments([repo(1)], [], 2, "ffffffff").nextCursor).toBeNull();
    expect(pageFromSegments([], [], 2, "ffffffff").nextCursor).toBeNull();
  });
});

describe("listFeedPage", () => {
  const all = Array.from({ length: 25 }, (_, i) => repo(i + 1));
  // Semilla de entrada a mitad del rango: fuerza que la vuelta ocurra.
  const START = "80000000";

  it("sirve la primera página desde la semilla de entrada, en orden (card_seed, id) desc", async () => {
    const page = await listFeedPage(fakeDb(all), null, FEED_PAGE_SIZE, {}, START);
    const esperado = [...all]
      .filter((r) => r.card_seed <= START)
      .sort((a, b) => b.card_seed.localeCompare(a.card_seed));
    expect(page.repos.map((r) => r.id)).toEqual(esperado.slice(0, FEED_PAGE_SIZE).map((r) => r.id));
    expect(page.nextCursor).not.toBeNull();
  });

  it("el orden no es el cronológico de importación: rompe los bloques por autor", async () => {
    const page = await listFeedPage(fakeDb(all), null, FEED_PAGE_SIZE, {}, "ffffffff");
    const cronologico = [...all]
      .sort((a, b) => b.imported_at.localeCompare(a.imported_at))
      .slice(0, FEED_PAGE_SIZE);
    expect(page.repos.map((r) => r.id)).not.toEqual(cronologico.map((r) => r.id));
  });

  it("la vuelta completa recorre todo el feed exactamente una vez, sin duplicar ni saltar", async () => {
    const vistos: string[] = [];
    let cursor: string | null = null;
    let paginas = 0;
    do {
      const page: Awaited<ReturnType<typeof listFeedPage>> = await listFeedPage(
        fakeDb(all),
        cursor,
        FEED_PAGE_SIZE,
        {},
        START,
      );
      vistos.push(...page.repos.map((r) => r.id));
      cursor = page.nextCursor;
      paginas++;
    } while (cursor && paginas < 10);

    expect(paginas).toBe(3); // 25 fichas en páginas de 10: la vuelta ocurre de verdad
    expect(vistos).toHaveLength(25);
    expect(new Set(vistos).size).toBe(25);
  });

  it("dos semillas de entrada distintas arrancan el feed en fichas distintas", async () => {
    const a = await listFeedPage(fakeDb(all), null, FEED_PAGE_SIZE, {}, "80000000");
    const b = await listFeedPage(fakeDb(all), null, FEED_PAGE_SIZE, {}, "20000000");
    expect(a.repos[0].id).not.toEqual(b.repos[0].id);
  });

  it("una fila nueva insertada entre páginas no desplaza las siguientes (keyset, no offset)", async () => {
    const primera = await listFeedPage(fakeDb(all), null, FEED_PAGE_SIZE, {}, START);
    const segundaSinNuevo = await listFeedPage(fakeDb(all), primera.nextCursor);
    // Entra un repo nuevo después de servir la primera página.
    const segundaConNuevo = await listFeedPage(fakeDb([...all, repo(99)]), primera.nextCursor);
    const idsNuevos = segundaConNuevo.repos.filter((r) => r.github_repo_id !== 99).map((r) => r.id);
    expect(idsNuevos).toEqual(
      segundaSinNuevo.repos.map((r) => r.id).filter((id) => idsNuevos.includes(id)),
    );
    // Y nada de lo ya servido se repite.
    const servidos = new Set(primera.repos.map((r) => r.id));
    for (const r of segundaConNuevo.repos) expect(servidos.has(r.id)).toBe(false);
  });

  it("solo sirve repos activos", async () => {
    const conRemoved = [...all];
    conRemoved[0] = { ...conRemoved[0], status: "removed" };
    const vistos: string[] = [];
    let cursor: string | null = null;
    do {
      const page: Awaited<ReturnType<typeof listFeedPage>> = await listFeedPage(
        fakeDb(conRemoved),
        cursor,
        FEED_PAGE_SIZE,
        {},
        START,
      );
      vistos.push(...page.repos.map((r) => r.id));
      cursor = page.nextCursor;
    } while (cursor);
    expect(vistos).toHaveLength(24);
    expect(vistos).not.toContain(conRemoved[0].id);
  });
});
