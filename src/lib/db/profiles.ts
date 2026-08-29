import type { Db } from "./client";

/** Fila de la tabla `profiles` (ver docs/data-model.md y migración 003). */
export interface ProfileRow {
  clerk_id: string;
  github_id: number | null;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

/**
 * Identidad mínima que necesitamos del usuario de Clerk. Es un subconjunto
 * estructural del `User` de @clerk/nextjs para poder testear sin mockear Clerk.
 */
export interface ClerkUserLike {
  id: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  externalAccounts: Array<{
    provider: string;
    externalId: string | null;
    username: string | null;
    imageUrl: string | null;
  }>;
}

/** Extrae la identidad de GitHub del usuario de Clerk (M-01). */
export function mapClerkUserToProfile(user: ClerkUserLike): ProfileRow {
  const github = user.externalAccounts.find((account) =>
    account.provider === "oauth_github" || account.provider === "github",
  );

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || null;
  const githubId = github?.externalId != null ? Number(github.externalId) : null;

  return {
    clerk_id: user.id,
    github_id: Number.isFinite(githubId) ? githubId : null,
    username: github?.username || user.username || `user_${user.id.slice(-8)}`,
    display_name: displayName,
    avatar_url: github?.imageUrl || user.imageUrl || null,
  };
}

/**
 * Crea el perfil en el primer login y lo refresca en los siguientes: upsert
 * idempotente por `clerk_id`. Sin usuario (sesión ausente o cancelada) no toca
 * la base de datos — es el negativo de M-01: ningún perfil a medias.
 */
export async function ensureProfile(db: Db, user: ClerkUserLike | null): Promise<ProfileRow | null> {
  if (!user) return null;
  const row = mapClerkUserToProfile(user);
  const { error } = await db.from("profiles").upsert(row, { onConflict: "clerk_id" });
  if (error) throw new Error(`Error al asegurar el perfil: ${error.message}`);
  return row;
}

/** Perfil persistido, con su `id` (lo necesita `repos.owner_profile_id`). */
export async function getProfileByClerkId(
  db: Db,
  clerkId: string,
): Promise<(ProfileRow & { id: string }) | null> {
  const { data, error } = await db.from("profiles").select("*").eq("clerk_id", clerkId).maybeSingle();
  if (error) throw new Error(`Error al leer el perfil: ${error.message}`);
  return (data as (ProfileRow & { id: string }) | null) ?? null;
}

/** Perfil público por username (login de GitHub, la URL de /u/[username]). */
export async function getProfileByUsername(
  db: Db,
  username: string,
): Promise<(ProfileRow & { id: string }) | null> {
  const { data, error } = await db.from("profiles").select("*").eq("username", username).maybeSingle();
  if (error) throw new Error(`Error al leer el perfil: ${error.message}`);
  return (data as (ProfileRow & { id: string }) | null) ?? null;
}
