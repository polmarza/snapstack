/**
 * Paginación keyset del feed (M-06): orden cronológico estable por
 * (ORDEN, id) descendente. Con inserts continuos, el offset duplica o salta
 * fichas; el keyset no. El cursor viaja como token opaco (base64url de JSON).
 *
 * El campo de orden está parametrizado aquí y solo aquí: si algún día el feed
 * ordena por última actividad (MEJORA-01, con M-08), se cambia en un sitio.
 */

import type { Db } from "./client";
import type { RepoRow } from "./repos";

export const FEED_PAGE_SIZE = 10;
export const FEED_ORDER_FIELD = "imported_at" as const;

export interface FeedCursor {
  /** Valor del campo de orden del último elemento servido (ISO). */
  t: string;
  /** Desempate: id del último elemento servido. */
  id: string;
}

export interface FeedPage {
  repos: FeedRepo[];
  /** null cuando no queda más contenido: el fin del feed es explícito. */
  nextCursor: string | null;
}

/** Fila del feed: RepoRow más el campo de orden y el id que necesita el cursor. */
export type FeedRepo = RepoRow & { id: string; imported_at: string };

export function encodeCursor(cursor: FeedCursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

/** Devuelve null ante un cursor ausente o corrupto: la página vuelve al principio. */
export function decodeCursor(token: string | null | undefined): FeedCursor | null {
  if (!token) return null;
  try {
    const parsed = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
    if (typeof parsed?.t === "string" && typeof parsed?.id === "string") {
      return { t: parsed.t, id: parsed.id };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Corta el resultado de una consulta de `limit + 1` filas en página + cursor:
 * la fila extra solo indica que hay más contenido, no se sirve.
 */
export function pageFromRows(rows: FeedRepo[], limit: number): FeedPage {
  const hasMore = rows.length > limit;
  const repos = hasMore ? rows.slice(0, limit) : rows;
  const last = repos[repos.length - 1];
  return {
    repos,
    nextCursor: hasMore && last ? encodeCursor({ t: last[FEED_ORDER_FIELD], id: last.id }) : null,
  };
}

export async function listFeedPage(
  db: Db,
  cursorToken?: string | null,
  limit = FEED_PAGE_SIZE,
): Promise<FeedPage> {
  const cursor = decodeCursor(cursorToken);

  let query = db
    .from("repos")
    .select("*")
    .eq("status", "active")
    .order(FEED_ORDER_FIELD, { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    // Keyset: (t, id) estrictamente menores que el último elemento servido.
    query = query.or(
      `${FEED_ORDER_FIELD}.lt.${cursor.t},and(${FEED_ORDER_FIELD}.eq.${cursor.t},id.lt.${cursor.id})`,
    );
  }

  const { data, error } = await query;
  if (error) throw new Error(`Error al paginar el feed: ${error.message}`);
  return pageFromRows((data ?? []) as FeedRepo[], limit);
}
