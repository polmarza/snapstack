/**
 * OAuth user-to-server de la GitHub App (C-07): el token resultante queda
 * limitado a los permisos de la App (Starring), no a scopes clásicos anchos.
 */

export interface GithubAppTokens {
  accessToken: string;
  /** Solo si la App tiene expiración de tokens activada. */
  refreshToken: string | null;
  /** ISO; null = el token no expira. */
  accessExpiresAt: string | null;
}

const clientId = () => process.env.GITHUB_APP_CLIENT_ID ?? "";
const clientSecret = () => process.env.GITHUB_APP_CLIENT_SECRET ?? "";

/** ¿Está la App configurada? Sin esto, la estrella queda pasiva (interruptor). */
export function githubAppConfigured(): boolean {
  return Boolean(process.env.GITHUB_APP_CLIENT_ID && process.env.GITHUB_APP_CLIENT_SECRET);
}

export function buildAuthorizeUrl(state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: clientId(),
    redirect_uri: redirectUri,
    state,
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  error?: string;
  error_description?: string;
}

async function tokenRequest(
  body: Record<string, string>,
  fetchImpl: typeof fetch,
): Promise<GithubAppTokens> {
  const response = await fetchImpl("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId(), client_secret: clientSecret(), ...body }),
  });
  if (!response.ok) throw new Error(`GitHub devolvió ${response.status} al canjear el token`);
  const data = (await response.json()) as TokenResponse;
  if (!data.access_token) {
    throw new Error(`GitHub rechazó el canje: ${data.error_description ?? data.error ?? "sin detalle"}`);
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    accessExpiresAt:
      typeof data.expires_in === "number"
        ? new Date(Date.now() + data.expires_in * 1000).toISOString()
        : null,
  };
}

export function exchangeCode(code: string, fetchImpl: typeof fetch = fetch): Promise<GithubAppTokens> {
  return tokenRequest({ code }, fetchImpl);
}

export function refreshAccessToken(
  refreshToken: string,
  fetchImpl: typeof fetch = fetch,
): Promise<GithubAppTokens> {
  return tokenRequest({ grant_type: "refresh_token", refresh_token: refreshToken }, fetchImpl);
}

export interface UserInstallation {
  id: number;
  appSlug: string;
}

/**
 * Instalaciones de Apps visibles para el usuario (C-08), con su token
 * user-to-server. Es la fuente de verdad más fiable que tenemos: los webhooks
 * pueden haberse perdido (App instalada antes de que existiera el handler) o
 * no repetirse (actualizar una instalación no reemite `installation.created`).
 */
export async function listUserInstallations(
  token: string,
  fetchImpl: typeof fetch = fetch,
): Promise<UserInstallation[]> {
  const response = await fetchImpl("https://api.github.com/user/installations?per_page=100", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub devolvió ${response.status} al listar instalaciones`);
  }
  const body = (await response.json()) as {
    installations?: Array<{ id?: number; app_slug?: string }>;
  };
  return (body.installations ?? [])
    .filter((i): i is { id: number; app_slug: string } =>
      typeof i.id === "number" && typeof i.app_slug === "string",
    )
    .map((i) => ({ id: i.id, appSlug: i.app_slug }));
}
