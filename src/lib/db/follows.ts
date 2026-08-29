import type { Db } from "./client";

/**
 * Follows nativos de Snapstack (M-07): alimentan el filtro "Following" del
 * feed. No espejan el follow de GitHub (decisión de ficha).
 */

export class SelfFollowError extends Error {
  constructor() {
    super("You can't follow yourself");
  }
}

export async function setFollowing(
  db: Db,
  followerId: string,
  followedId: string,
  following: boolean,
): Promise<void> {
  if (followerId === followedId) throw new SelfFollowError();

  if (following) {
    // Idempotente: seguir dos veces no duplica (PK compuesta + ignoreDuplicates).
    const { error } = await db
      .from("follows")
      .upsert(
        { follower_id: followerId, followed_id: followedId },
        { onConflict: "follower_id,followed_id", ignoreDuplicates: true },
      );
    if (error) throw new Error(`Error al seguir: ${error.message}`);
    return;
  }

  const { error } = await db
    .from("follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("followed_id", followedId);
  if (error) throw new Error(`Error al dejar de seguir: ${error.message}`);
}

/** Ids de perfiles a los que sigue `followerId`. */
export async function listFollowedIds(db: Db, followerId: string): Promise<string[]> {
  const { data, error } = await db.from("follows").select("followed_id").eq("follower_id", followerId);
  if (error) throw new Error(`Error al listar seguidos: ${error.message}`);
  return (data ?? []).map((row) => (row as { followed_id: string }).followed_id);
}

export async function isFollowing(db: Db, followerId: string, followedId: string): Promise<boolean> {
  const { data, error } = await db
    .from("follows")
    .select("followed_id")
    .eq("follower_id", followerId)
    .eq("followed_id", followedId)
    .maybeSingle();
  if (error) throw new Error(`Error al comprobar follow: ${error.message}`);
  return data !== null;
}

export interface FollowCounts {
  followers: number;
  following: number;
}

/**
 * Contadores del perfil: cuántos le siguen y a cuántos sigue. Dos counts
 * `head` (sin filas) en paralelo; con los volúmenes de v1 no hace falta
 * desnormalizar.
 */
export async function getFollowCounts(db: Db, profileId: string): Promise<FollowCounts> {
  const [followers, following] = await Promise.all([
    db.from("follows").select("*", { count: "exact", head: true }).eq("followed_id", profileId),
    db.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", profileId),
  ]);
  if (followers.error) throw new Error(`Error al contar followers: ${followers.error.message}`);
  if (following.error) throw new Error(`Error al contar seguidos: ${following.error.message}`);
  return { followers: followers.count ?? 0, following: following.count ?? 0 };
}
