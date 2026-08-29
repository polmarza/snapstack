/**
 * Estrellas reales (C-07): PUT/DELETE /user/starred con el token de usuario de
 * la App. `full_name` se valida antes de componer la URL: viene de la base,
 * pero un dato es un dato y esto es una petición autenticada.
 */

// Owner: los logins de GitHub no llevan puntos ni barras bajas. Repo: puede
// llevarlos (.github), pero nunca ser solo puntos — "a/.." sería traversal.
const FULL_NAME_RE = /^[A-Za-z0-9-]+\/(?!\.+$)[A-Za-z0-9_.-]+$/;

export class GithubTokenRevokedError extends Error {
  constructor() {
    super("El token de GitHub ya no es válido");
  }
}

/** 403: la App no tiene (o la instalación no ha aprobado) el permiso Starring. */
export class GithubMissingPermissionError extends Error {
  constructor() {
    super("GitHub rechazó la petición por falta de permiso");
  }
}

function assertFullName(fullName: string): void {
  if (!FULL_NAME_RE.test(fullName)) throw new Error(`full_name inesperado: ${fullName}`);
}

const headers = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
});

/** ¿Tiene el usuario estrella en el repo? 204 = sí, 404 = no. */
export async function isStarred(
  token: string,
  fullName: string,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  assertFullName(fullName);
  const response = await fetchImpl(`https://api.github.com/user/starred/${fullName}`, {
    headers: headers(token),
  });
  if (response.status === 204) return true;
  if (response.status === 404) return false;
  if (response.status === 401) throw new GithubTokenRevokedError();
  if (response.status === 403) throw new GithubMissingPermissionError();
  throw new Error(`GitHub devolvió ${response.status} al consultar la estrella`);
}

/** Da o quita la estrella. Idempotente en GitHub: repetir no falla. */
export async function setStar(
  token: string,
  fullName: string,
  starred: boolean,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  assertFullName(fullName);
  const response = await fetchImpl(`https://api.github.com/user/starred/${fullName}`, {
    method: starred ? "PUT" : "DELETE",
    headers: { ...headers(token), "Content-Length": "0" },
  });
  if (response.status === 204) return;
  if (response.status === 401) throw new GithubTokenRevokedError();
  if (response.status === 403) throw new GithubMissingPermissionError();
  throw new Error(`GitHub devolvió ${response.status} al ${starred ? "dar" : "quitar"} la estrella`);
}
