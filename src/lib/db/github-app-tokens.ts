import type { Db } from "./client";
import { decryptSecret, encryptSecret } from "@/lib/crypto/secret-box";
import { refreshAccessToken, type GithubAppTokens } from "@/lib/github/app-oauth";

/**
 * Tokens user-to-server de la GitHub App (C-07), cifrados en reposo. El access
 * token se refresca solo si caduca (cuando la App emite refresh tokens).
 */

interface TokenRow {
  profile_id: string;
  access_token_enc: string;
  refresh_token_enc: string | null;
  access_expires_at: string | null;
}

export async function saveGithubAppTokens(
  db: Db,
  profileId: string,
  tokens: GithubAppTokens,
): Promise<void> {
  const { error } = await db.from("github_app_tokens").upsert(
    {
      profile_id: profileId,
      access_token_enc: encryptSecret(tokens.accessToken),
      refresh_token_enc: tokens.refreshToken ? encryptSecret(tokens.refreshToken) : null,
      access_expires_at: tokens.accessExpiresAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "profile_id" },
  );
  if (error) throw new Error(`Error al guardar los tokens: ${error.message}`);
}

/** Borra los tokens (revocación detectada o baja). */
export async function deleteGithubAppTokens(db: Db, profileId: string): Promise<void> {
  const { error } = await db.from("github_app_tokens").delete().eq("profile_id", profileId);
  if (error) throw new Error(`Error al borrar los tokens: ${error.message}`);
}

/**
 * Access token vigente del perfil, o null si nunca conectó. Si está caducado
 * (margen de 2 min) y hay refresh token, se renueva y persiste sobre la marcha.
 */
export async function getGithubAppToken(db: Db, profileId: string): Promise<string | null> {
  const { data, error } = await db
    .from("github_app_tokens")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (error) throw new Error(`Error al leer los tokens: ${error.message}`);
  const row = data as TokenRow | null;
  if (!row) return null;

  const caducado =
    row.access_expires_at !== null &&
    Date.parse(row.access_expires_at) < Date.now() + 2 * 60 * 1000;
  if (!caducado) return decryptSecret(row.access_token_enc);

  if (!row.refresh_token_enc) {
    await deleteGithubAppTokens(db, profileId);
    return null;
  }
  const renovados = await refreshAccessToken(decryptSecret(row.refresh_token_enc));
  await saveGithubAppTokens(db, profileId, renovados);
  return renovados.accessToken;
}
