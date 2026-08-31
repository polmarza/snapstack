/**
 * Paginación keyset del feed (M-06, revisada por C-11).
 *
 * **Qué cambió y por qué.** Hasta la ficha `notas-de-repo` el feed iba
 * barajado: orden pseudoaleatorio estable por `card_seed`, con entrada
 * aleatoria y vuelta completa, para que los cinco repos del mismo autor no
 * salieran en bloque. Con notas dentro, ese orden deja de valer: una nota es
 * una novedad, y una novedad de hace una semana no puede estar arriba del todo.
 * Gana la recencia — y se pierde la propiedad de reparto que daba el barajado
 * (ver "Decisiones tomadas" en la ficha).
 *
 * **La unidad ya no es el repo, es el ítem**, que puede ser `repo` o `note`.
 * Cada uno trae su instante en el feed: el repo, cuándo entró a la selección;
 * la nota, cuándo se escribió. Se piden las dos tablas por separado con el
 * mismo keyset y se mezclan aquí: no hay vista ni tabla unificada que mantener
 * en dos sitios, y cada consulta usa su propio índice.
 *
 * El orden total es `(at, id)` descendente. `id` desempata: son uuid y son
 * únicos entre tablas, así que dos ítems con el mismo instante siempre caen en
 * el mismo orden en la base y aquí. El cursor viaja como token opaco.
 */

import type { Db } from "./client";
import type { NoteWithContext } from "./notes";
import { NOTE_SELECT } from "./notes";
import type { RepoRow } from "./repos";

export const FEED_PAGE_SIZE = 10;

export interface FeedCursor {
  /** Instante del último ítem servido (timestamptz tal cual lo da PostgREST). */
  t: string;
  /** Desempate: id del último ítem servido. */
  id: string;
}

/** Fila de repo en el feed. */
export type FeedRepo = RepoRow & {
  id: string;
  imported_at: string;
  /** true/false con sesión (¿sigo al dueño?); ausente sin sesión o sin dueño. */
  owner_followed?: boolean;
};

/** Nota en el feed, con su autor y el repo del que cuelga. */
export type FeedNote = NoteWithContext & {
  /** true/false con sesión (¿sigo al autor?); ausente sin sesión o si es mía. */
  author_followed?: boolean;
};

export type FeedItem =
  | { kind: "repo"; at: string; id: string; repo: FeedRepo }
  | { kind: "note"; at: string; id: string; note: FeedNote };

export interface FeedPage {
  items: FeedItem[];
  /** null cuando no queda más contenido: el fin del feed es explícito. */
  nextCursor: string | null;
}

export function encodeCursor(cursor: FeedCursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

const CURSOR_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** `2026-08-31T11:36:26.123456+00:00` — con fracción opcional y offset o Z. */
const CURSOR_TS_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?([+-]\d{2}:\d{2}|Z)$/;

/**
 * Devuelve null ante un cursor ausente, corrupto o con formato inesperado
 * (incluidos los cursores barajados anteriores a C-11): la página vuelve al
 * principio.
 *
 * El formato se valida estrictamente porque `t` e `id` acaban dentro del filtro
 * `or=(...)` de PostgREST, y ahí una coma o un paréntesis del cliente
 * cambiarían la condición de la consulta.
 */
export function decodeCursor(token: string | null | undefined): FeedCursor | null {
  if (!token) return null;
  try {
    const parsed = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
    if (typeof parsed?.t !== "string" || typeof parsed?.id !== "string") return null;
    if (!CURSOR_TS_RE.test(parsed.t)) return null;
    if (!CURSOR_UUID_RE.test(parsed.id)) return null;
    return { t: parsed.t, id: parsed.id };
  } catch {
    return null;
  }
}

/**
 * Orden del feed: por instante descendente, y a igualdad de instante por id
 * descendente. La comparación de los instantes es textual a propósito — son
 * ISO-8601 del mismo Postgres, con el mismo offset, así que el orden
 * lexicográfico coincide con el cronológico y no se pierde precisión por el
 * camino (`Date.parse` se come los microsegundos, y Postgres los guarda).
 */
export function compareFeedItems(a: FeedItem, b: FeedItem): number {
  if (a.at !== b.at) return a.at < b.at ? 1 : -1;
  if (a.id !== b.id) return a.id < b.id ? 1 : -1;
  return 0;
}

/**
 * Corta la mezcla de los dos orígenes en página + cursor. Entre ambos llegan
 * hasta `limit + 1` ítems por tabla: los que sobran solo indican que hay más.
 */
export function pageFromItems(items: FeedItem[], limit: number): FeedPage {
  const ordered = [...items].sort(compareFeedItems);
  const hasMore = ordered.length > limit;
  const served = hasMore ? ordered.slice(0, limit) : ordered;
  const last = served[served.length - 1];
  return {
    items: served,
    nextCursor: hasMore && last ? encodeCursor({ t: last.at, id: last.id }) : null,
  };
}

export interface FeedFilter {
  /** Restringe el feed a repos y notas de estos perfiles (filtro "Following", M-07). */
  ownerIn?: string[];
}

/** Keyset: `(at, id)` estrictamente menores que el último ítem servido. */
function keyset(field: string, cursor: FeedCursor): string {
  return `${field}.lt.${cursor.t},and(${field}.eq.${cursor.t},id.lt.${cursor.id})`;
}

export async function listFeedPage(
  db: Db,
  cursorToken?: string | null,
  limit = FEED_PAGE_SIZE,
  filter: FeedFilter = {},
): Promise<FeedPage> {
  // Sin seguidos, el resultado es el vacío explícito — sin tocar la base.
  if (filter.ownerIn && filter.ownerIn.length === 0) {
    return { items: [], nextCursor: null };
  }

  const cursor = decodeCursor(cursorToken);

  let repoQuery = db
    .from("repos")
    .select("*")
    .eq("status", "active")
    .order("imported_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);
  if (filter.ownerIn) repoQuery = repoQuery.in("owner_profile_id", filter.ownerIn);
  if (cursor) repoQuery = repoQuery.or(keyset("imported_at", cursor));

  let noteQuery = db
    .from("notes")
    .select(NOTE_SELECT)
    .eq("repo.status", "active")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);
  if (filter.ownerIn) noteQuery = noteQuery.in("author_profile_id", filter.ownerIn);
  if (cursor) noteQuery = noteQuery.or(keyset("created_at", cursor));

  const [repos, notes] = await Promise.all([repoQuery, noteQuery]);
  if (repos.error) throw new Error(`Error al paginar el feed: ${repos.error.message}`);
  if (notes.error) throw new Error(`Error al paginar las notas del feed: ${notes.error.message}`);

  const items: FeedItem[] = [
    ...((repos.data ?? []) as FeedRepo[]).map(
      (repo): FeedItem => ({ kind: "repo", at: repo.imported_at, id: repo.id, repo }),
    ),
    ...((notes.data ?? []) as unknown as FeedNote[]).map(
      (note): FeedItem => ({ kind: "note", at: note.created_at, id: note.id, note }),
    ),
  ];

  return pageFromItems(items, limit);
}

/**
 * Anota cada ítem con si el visitante sigue a su autor (para el botón Follow).
 * Lo propio se deja sin anotar: nadie se sigue a sí mismo y el botón no debe
 * aparecer ahí.
 */
export function annotateFollowed(
  page: FeedPage,
  followedIds: Set<string>,
  selfProfileId: string | null = null,
): FeedPage {
  return {
    ...page,
    items: page.items.map((item) => {
      if (item.kind === "repo") {
        const owner = item.repo.owner_profile_id;
        if (!owner || owner === selfProfileId) return item;
        return { ...item, repo: { ...item.repo, owner_followed: followedIds.has(owner) } };
      }
      const author = item.note.author_profile_id;
      if (!author || author === selfProfileId) return item;
      return { ...item, note: { ...item.note, author_followed: followedIds.has(author) } };
    }),
  };
}
