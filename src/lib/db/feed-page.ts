/**
 * Paginación keyset del feed (M-06, revisada en la ficha "feed-orden-aleatorio"):
 * orden pseudoaleatorio estable por (card_seed, id) descendente, con punto de
 * entrada aleatorio y vuelta completa. `card_seed` es el hash FNV-1a del repo:
 * uniforme y sin correlación con autor ni fecha de importación, así que rompe el
 * bloque de "los 5 repos del mismo usuario seguidos" que producía el orden
 * cronológico de importación.
 *
 * Cada visita arranca en una semilla `s` distinta y la paginación desciende
 * desde ahí; al agotar ese tramo, da la vuelta por arriba (`card_seed > s`)
 * hasta cerrar el círculo. Dentro de una sesión, el keyset garantiza que no se
 * repite ni se salta ninguna ficha — con offset, los inserts continuos
 * duplicarían o saltarían. El cursor viaja como token opaco (base64url de JSON).
 */

import { randomBytes } from "node:crypto";
import type { Db } from "./client";
import type { RepoRow } from "./repos";

export const FEED_PAGE_SIZE = 10;
export const FEED_ORDER_FIELD = "card_seed" as const;

export interface FeedCursor {
  /** Semilla de entrada de esta vuelta al feed (8 hex, formato de card_seed). */
  s: string;
  /** card_seed del último elemento servido. */
  t: string;
  /** Desempate: id del último elemento servido. */
  id: string;
  /** 1 si la paginación ya dio la vuelta por encima de `s`. */
  w: 0 | 1;
}

export interface FeedPage {
  repos: FeedRepo[];
  /** null cuando no queda más contenido: el fin del feed es explícito. */
  nextCursor: string | null;
}

/** Fila del feed: RepoRow más el id que necesita el cursor. */
export type FeedRepo = RepoRow & {
  id: string;
  imported_at: string;
  /** true/false con sesión (¿sigo al dueño?); ausente sin sesión o sin dueño. */
  owner_followed?: boolean;
};

/** Semilla de entrada aleatoria: 8 hex, el mismo formato que card_seed. */
export function randomStartSeed(): string {
  return randomBytes(4).toString("hex");
}

export function encodeCursor(cursor: FeedCursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

const CURSOR_SEED_RE = /^[0-9a-f]{8}$/;
const CURSOR_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Devuelve null ante un cursor ausente, corrupto o con formato inesperado
 * (incluidos los cursores cronológicos anteriores a esta revisión): la página
 * vuelve al principio.
 *
 * El formato se valida estrictamente porque `t` e `id` acaban dentro del
 * filtro `or=(...)` de PostgREST, y ahí una coma o un paréntesis del cliente
 * cambiarían la condición de la consulta.
 */
export function decodeCursor(token: string | null | undefined): FeedCursor | null {
  if (!token) return null;
  try {
    const parsed = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
    if (typeof parsed?.s !== "string" || typeof parsed?.t !== "string" || typeof parsed?.id !== "string") {
      return null;
    }
    if (!CURSOR_SEED_RE.test(parsed.s) || !CURSOR_SEED_RE.test(parsed.t)) return null;
    if (!CURSOR_UUID_RE.test(parsed.id)) return null;
    if (parsed.w !== 0 && parsed.w !== 1) return null;
    return { s: parsed.s, t: parsed.t, id: parsed.id, w: parsed.w };
  } catch {
    return null;
  }
}

/**
 * Corta las filas de los dos tramos de la vuelta (antes y después del salto
 * por arriba) en página + cursor. Entre ambos llegan hasta `limit + 1` filas:
 * la extra solo indica que hay más contenido, no se sirve.
 */
export function pageFromSegments(
  beforeWrap: FeedRepo[],
  afterWrap: FeedRepo[],
  limit: number,
  start: string,
): FeedPage {
  const all = [
    ...beforeWrap.map((row) => ({ row, w: 0 as const })),
    ...afterWrap.map((row) => ({ row, w: 1 as const })),
  ];
  const hasMore = all.length > limit;
  const served = hasMore ? all.slice(0, limit) : all;
  const last = served[served.length - 1];
  return {
    repos: served.map((item) => item.row),
    nextCursor:
      hasMore && last
        ? encodeCursor({ s: start, t: last.row[FEED_ORDER_FIELD], id: last.row.id, w: last.w })
        : null,
  };
}

export interface FeedFilter {
  /** Restringe el feed a repos de estos dueños (filtro "Following", M-07). */
  ownerIn?: string[];
}

export async function listFeedPage(
  db: Db,
  cursorToken?: string | null,
  limit = FEED_PAGE_SIZE,
  filter: FeedFilter = {},
  /** Semilla de entrada explícita (tests); sin cursor ni semilla, aleatoria. */
  startSeed?: string,
): Promise<FeedPage> {
  // Sin seguidos, el resultado es el vacío explícito — sin tocar la base.
  if (filter.ownerIn && filter.ownerIn.length === 0) {
    return { repos: [], nextCursor: null };
  }

  const cursor = decodeCursor(cursorToken);
  const start = cursor?.s ?? (startSeed && CURSOR_SEED_RE.test(startSeed) ? startSeed : randomStartSeed());

  const base = () => {
    let query = db
      .from("repos")
      .select("*")
      .eq("status", "active")
      .order(FEED_ORDER_FIELD, { ascending: false })
      .order("id", { ascending: false });
    if (filter.ownerIn) query = query.in("owner_profile_id", filter.ownerIn);
    return query;
  };

  // Keyset: (t, id) estrictamente menores que el último elemento servido.
  const keyset = (c: FeedCursor) =>
    `${FEED_ORDER_FIELD}.lt.${c.t},and(${FEED_ORDER_FIELD}.eq.${c.t},id.lt.${c.id})`;

  // Tramo 1: desde la semilla de entrada hacia abajo.
  let beforeWrap: FeedRepo[] = [];
  if (!cursor || cursor.w === 0) {
    const query = cursor
      ? base().or(keyset(cursor)).limit(limit + 1)
      : base().lte(FEED_ORDER_FIELD, start).limit(limit + 1);
    const { data, error } = await query;
    if (error) throw new Error(`Error al paginar el feed: ${error.message}`);
    beforeWrap = (data ?? []) as FeedRepo[];
  }

  // Tramo 2 (la vuelta por arriba): solo lo que falte para limit + 1.
  const missing = limit + 1 - beforeWrap.length;
  let afterWrap: FeedRepo[] = [];
  if (missing > 0) {
    let query = base().gt(FEED_ORDER_FIELD, start).limit(missing);
    if (cursor?.w === 1) query = query.or(keyset(cursor));
    const { data, error } = await query;
    if (error) throw new Error(`Error al paginar el feed (vuelta): ${error.message}`);
    afterWrap = (data ?? []) as FeedRepo[];
  }

  return pageFromSegments(beforeWrap, afterWrap, limit, start);
}

/** Anota cada tarjeta con si el visitante sigue a su dueño (para el botón Follow). */
export function annotateFollowed(page: FeedPage, followedIds: Set<string>): FeedPage {
  return {
    ...page,
    repos: page.repos.map((repo) =>
      repo.owner_profile_id
        ? { ...repo, owner_followed: followedIds.has(repo.owner_profile_id) }
        : repo,
    ),
  };
}
