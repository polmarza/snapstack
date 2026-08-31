import type { Db } from "./client";

/**
 * Notas ancladas a un repo (C-09).
 *
 * La regla que sostiene la feature: **no existe la nota sin repo**, y no vale
 * cualquier repo — tiene que ser uno de los tuyos y estar activo. Eso se
 * comprueba aquí, en servidor, y no en el compositor: el cliente puede mandar
 * el `repo_id` que le dé la gana.
 *
 * El cuerpo es texto plano. Ni se interpreta Markdown ni se renderiza HTML: se
 * pinta como texto en React, que escapa por defecto. La única normalización es
 * recortar espacios y colapsar los saltos de línea de más.
 */

export const NOTE_MAX_LENGTH = 500;

export interface NoteRow {
  id: string;
  author_profile_id: string;
  repo_id: string;
  body: string;
  created_at: string;
}

/** Nota con lo que hace falta para pintarla: su autor y el repo del que cuelga. */
export interface NoteWithContext extends NoteRow {
  author: { username: string; display_name: string | null; avatar_url: string | null } | null;
  repo: {
    id: string;
    full_name: string;
    primary_language: string | null;
    github_repo_id: number;
  } | null;
}

/** Lo que se pide a PostgREST para tener la nota lista de pintar. */
export const NOTE_SELECT =
  "id, author_profile_id, repo_id, body, created_at, " +
  "author:profiles!notes_author_profile_id_fkey(username, display_name, avatar_url), " +
  "repo:repos!notes_repo_id_fkey!inner(id, full_name, primary_language, github_repo_id, status)";

export class NoteValidationError extends Error {}

/**
 * Normaliza el cuerpo: recorta, deja los saltos de línea simples y colapsa tres
 * o más seguidos en dos. Sin esto, una nota de 500 saltos de línea pasa el
 * `check` de la base y ocupa media pantalla del feed.
 */
export function normalizeNoteBody(raw: string): string {
  return raw.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** Valida el cuerpo y devuelve el texto ya normalizado, o lanza. */
export function validateNoteBody(raw: string): string {
  const body = normalizeNoteBody(raw);
  if (body.length === 0) throw new NoteValidationError("The note is empty.");
  if (body.length > NOTE_MAX_LENGTH) {
    throw new NoteValidationError(`The note is longer than ${NOTE_MAX_LENGTH} characters.`);
  }
  return body;
}

/**
 * Crea una nota. Comprueba el ancla contra la base: el repo tiene que existir,
 * estar activo y ser del autor. Un repo ajeno, retirado o inexistente se
 * rechaza igual — escribes sobre lo tuyo (comentar lo de otro es MEJORA-11).
 */
export async function createNote(
  db: Db,
  authorProfileId: string,
  repoId: string,
  rawBody: string,
): Promise<NoteRow> {
  const body = validateNoteBody(rawBody);

  const { data: repo, error: repoError } = await db
    .from("repos")
    .select("id, owner_profile_id, status")
    .eq("id", repoId)
    .maybeSingle();
  if (repoError) throw new Error(`Error al comprobar el repo: ${repoError.message}`);

  const anchor = repo as { owner_profile_id: string | null; status: string } | null;
  if (!anchor || anchor.status !== "active" || anchor.owner_profile_id !== authorProfileId) {
    throw new NoteValidationError("You can only write notes about your own active repos.");
  }

  const { data, error } = await db
    .from("notes")
    .insert({ author_profile_id: authorProfileId, repo_id: repoId, body })
    .select("id, author_profile_id, repo_id, body, created_at")
    .single();
  if (error) throw new Error(`Error al crear la nota: ${error.message}`);
  return data as NoteRow;
}

/**
 * Borra una nota. El `eq` sobre el autor es la autorización: si la nota no es
 * suya, no se borra nada y se devuelve false — sin filtrar si existía.
 */
export async function deleteNote(db: Db, authorProfileId: string, noteId: string): Promise<boolean> {
  const { data, error } = await db
    .from("notes")
    .delete()
    .eq("id", noteId)
    .eq("author_profile_id", authorProfileId)
    .select("id");
  if (error) throw new Error(`Error al borrar la nota: ${error.message}`);
  return (data ?? []).length > 0;
}

/** Notas de un repo, más recientes primero (página de detalle). */
export async function listNotesForRepo(db: Db, repoId: string, limit = 20): Promise<NoteWithContext[]> {
  const { data, error } = await db
    .from("notes")
    .select(NOTE_SELECT)
    .eq("repo_id", repoId)
    .eq("repo.status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Error al listar las notas del repo: ${error.message}`);
  return (data ?? []) as unknown as NoteWithContext[];
}

/** Notas de un autor, más recientes primero (perfil). */
export async function listNotesForProfile(
  db: Db,
  profileId: string,
  limit = 50,
): Promise<NoteWithContext[]> {
  const { data, error } = await db
    .from("notes")
    .select(NOTE_SELECT)
    .eq("author_profile_id", profileId)
    .eq("repo.status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Error al listar las notas del perfil: ${error.message}`);
  return (data ?? []) as unknown as NoteWithContext[];
}
