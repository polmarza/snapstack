import type { Db } from "./client";
import { getGithubAppToken } from "./github-app-tokens";
import { listUserInstallations } from "@/lib/github/app-oauth";

/**
 * Estado de la instalación de la App para un perfil (C-08).
 *
 * La marca de la base la mantienen los webhooks, pero no siempre llega: la App
 * pudo instalarse antes de que existiera el handler, y **actualizar** una
 * instalación (cambiar los repos cubiertos) no reemite `installation.created`.
 * Por eso, cuando hay token de usuario, se comprueba contra GitHub y se
 * corrige la marca — en los dos sentidos: instalada y desinstalada.
 */
export async function syncInstallationState(
  db: Db,
  profileId: string,
  storedInstallationId: number | null,
): Promise<number | null> {
  const slug = process.env.NEXT_PUBLIC_GITHUB_APP_SLUG;
  if (!slug) return storedInstallationId;

  let token: string | null = null;
  try {
    token = await getGithubAppToken(db, profileId);
  } catch {
    return storedInstallationId; // sin token utilizable, vale lo guardado
  }
  if (!token) return storedInstallationId;

  let encontrada: number | null = null;
  try {
    const instalaciones = await listUserInstallations(token);
    encontrada = instalaciones.find((i) => i.appSlug === slug)?.id ?? null;
  } catch {
    return storedInstallationId; // GitHub caído o token justo: no se toca nada
  }

  if (encontrada !== storedInstallationId) {
    await db
      .from("profiles")
      .update({ github_installation_id: encontrada })
      .eq("id", profileId);
  }
  return encontrada;
}
