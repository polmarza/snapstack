import type { Db } from "./client";

/**
 * Notificaciones in-app (C-04). v1 solo emite `new_follower`; la tabla y estas
 * funciones son genéricas para que la actividad de repos seguidos (punto 6 del
 * feedback, futura) se monte encima sin migrar nada.
 */

export type NotificationType = "new_follower";

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
