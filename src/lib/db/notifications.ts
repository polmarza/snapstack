import type { Db } from "./client";

/**
 * Notificaciones in-app (C-04). v1 solo emite `new_follower`; la tabla y estas
 * funciones son genéricas para que la actividad de repos seguidos (punto 6 del
 * feedback, futura) se monte encima sin migrar nada.
 */

export type NotificationType = "new_follower" | "repo_update" | "new_note";

export interface NotificationRow {
  id: string;
  recipient_profile_id: string;
  actor_profile_id: string | null;
  type: NotificationType;
  payload: Record<string, unknown>;
  created_at: string;
  read_at: string | null;
}

/** Fila del listado, con la identidad del actor embebida. */
export type NotificationWithActor = NotificationRow & {
  actor: { username: string; display_name: string | null; avatar_url: string | null } | null;
};

/**
 * Crea la notificación de nuevo seguidor. Una por par (destinatario, actor)
 * para siempre: dejar de seguir y volver a seguir no notifica otra vez
 * (anti-spam). Una carrera produciría a lo sumo un duplicado inocuo — mejor
 * eso que un índice único que impediría tipos futuros con repetición.
 */
export async function createFollowNotification(
  db: Db,
  recipientProfileId: string,
  actorProfileId: string,
): Promise<boolean> {
  if (recipientProfileId === actorProfileId) return false;

  const { data: existing, error: readError } = await db
    .from("notifications")
    .select("id")
    .eq("recipient_profile_id", recipientProfileId)
    .eq("actor_profile_id", actorProfileId)
    .eq("type", "new_follower")
    .maybeSingle();
  if (readError) throw new Error(`Error al comprobar la notificación: ${readError.message}`);
  if (existing) return false;

  const { error } = await db.from("notifications").insert({
    recipient_profile_id: recipientProfileId,
    actor_profile_id: actorProfileId,
    type: "new_follower",
  });
  if (error) throw new Error(`Error al crear la notificación: ${error.message}`);
  return true;
}

/** No leídas del perfil, para el badge de la nav. */
export async function countUnreadNotifications(db: Db, profileId: string): Promise<number> {
  const { count, error } = await db
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("recipient_profile_id", profileId)
    .is("read_at", null);
  if (error) throw new Error(`Error al contar notificaciones: ${error.message}`);
  return count ?? 0;
}

/** Listado del perfil, más recientes primero, con la identidad del actor. */
export async function listNotifications(
  db: Db,
  profileId: string,
  limit = 50,
): Promise<NotificationWithActor[]> {
  const { data, error } = await db
    .from("notifications")
    .select(
      "*, actor:profiles!notifications_actor_profile_id_fkey(username, display_name, avatar_url)",
    )
    .eq("recipient_profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Error al listar notificaciones: ${error.message}`);
  return (data ?? []) as NotificationWithActor[];
}

/** Abrir /notifications marca todo leído (estilo LinkedIn). */
export async function markAllNotificationsRead(db: Db, profileId: string): Promise<void> {
  const { error } = await db
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_profile_id", profileId)
    .is("read_at", null);
  if (error) throw new Error(`Error al marcar leídas: ${error.message}`);
}

export interface RepoUpdatePayload {
  repo_id: string;
  full_name: string;
  /** Commits acumulados desde la última vez que se leyó. */
  commits: number;
  /** Diff del último push (o del rango acumulado si GitHub lo da). */
  compare: string;
  ref: string;
  [key: string]: unknown;
}

/**
 * Notificación de push para un suscriptor (C-06). Anti-ruido: si ya tiene una
 * repo_update NO leída del mismo repo, se acumula sobre ella (suma commits,
 * compare más reciente) en vez de apilar una por push. Las leídas no se tocan:
 * un push nuevo tras leer abre notificación nueva.
 */
export async function notifyRepoUpdate(
  db: Db,
  recipientProfileId: string,
  push: RepoUpdatePayload,
): Promise<void> {
  const { data: existing, error: readError } = await db
    .from("notifications")
    .select("id, payload")
    .eq("recipient_profile_id", recipientProfileId)
    .eq("type", "repo_update")
    .eq("payload->>repo_id", push.repo_id)
    .is("read_at", null)
    .maybeSingle();
  if (readError) throw new Error(`Error al buscar la notificación: ${readError.message}`);

  if (existing) {
    const previous = (existing as { payload: RepoUpdatePayload }).payload;
    const { error } = await db
      .from("notifications")
      .update({
        payload: { ...push, commits: (previous.commits ?? 0) + push.commits },
        created_at: new Date().toISOString(),
      })
      .eq("id", (existing as { id: string }).id);
    if (error) throw new Error(`Error al acumular la notificación: ${error.message}`);
    return;
  }

  const { error } = await db.from("notifications").insert({
    recipient_profile_id: recipientProfileId,
    actor_profile_id: null,
    type: "repo_update",
    payload: push,
  });
  if (error) throw new Error(`Error al crear la notificación: ${error.message}`);
}

export interface NewNotePayload {
  note_id: string;
  repo_id: string;
  full_name: string;
  /** Recorte del cuerpo, para leer la notificación sin abrirla. */
  excerpt: string;
  [key: string]: unknown;
}

/**
 * Notificación de nota nueva para un suscriptor del repo (C-09), sobre la vía
 * que C-06 ya abrió para los pushes.
 *
 * A diferencia de `repo_update`, **no se acumula**: cada nota es un texto que
 * alguien escribió a mano y fundir dos en una perdería la primera. El anti-ruido
 * aquí es que las notas las escribe una persona, no un `git push`.
 */
export async function notifyNewNote(
  db: Db,
  recipientProfileId: string,
  actorProfileId: string,
  note: NewNotePayload,
): Promise<boolean> {
  if (recipientProfileId === actorProfileId) return false;

  const { error } = await db.from("notifications").insert({
    recipient_profile_id: recipientProfileId,
    actor_profile_id: actorProfileId,
    type: "new_note",
    payload: note,
  });
  if (error) throw new Error(`Error al crear la notificación de nota: ${error.message}`);
  return true;
}
