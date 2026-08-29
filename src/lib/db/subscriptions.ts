import type { Db } from "./client";

/**
 * Suscripciones a repos (C-06): opt-in por repo para recibir notificaciones de
 * sus pushes. Es la inversa deliberada del "notificar todo y mutear lo
 * ruidoso": el control granular sin avalancha por defecto.
 */

export async function setSubscription(
  db: Db,
  subscriberProfileId: string,
  repoId: string,
  subscribed: boolean,
): Promise<void> {
  if (subscribed) {
    // Idempotente: suscribirse dos veces no duplica (PK compuesta).
    const { error } = await db
      .from("repo_subscriptions")
      .upsert(
        { subscriber_profile_id: subscriberProfileId, repo_id: repoId },
        { onConflict: "subscriber_profile_id,repo_id", ignoreDuplicates: true },
      );
    if (error) throw new Error(`Error al suscribir: ${error.message}`);
    return;
  }

  const { error } = await db
    .from("repo_subscriptions")
    .delete()
    .eq("subscriber_profile_id", subscriberProfileId)
    .eq("repo_id", repoId);
  if (error) throw new Error(`Error al cancelar la suscripción: ${error.message}`);
}

export async function isSubscribed(db: Db, subscriberProfileId: string, repoId: string): Promise<boolean> {
  const { data, error } = await db
    .from("repo_subscriptions")
    .select("repo_id")
    .eq("subscriber_profile_id", subscriberProfileId)
    .eq("repo_id", repoId)
    .maybeSingle();
  if (error) throw new Error(`Error al comprobar la suscripción: ${error.message}`);
  return data !== null;
}

/** Perfiles suscritos a un repo (para el webhook push). */
export async function listSubscriberIds(db: Db, repoId: string): Promise<string[]> {
  const { data, error } = await db
    .from("repo_subscriptions")
    .select("subscriber_profile_id")
    .eq("repo_id", repoId);
  if (error) throw new Error(`Error al listar suscriptores: ${error.message}`);
  return (data ?? []).map((row) => (row as { subscriber_profile_id: string }).subscriber_profile_id);
}
