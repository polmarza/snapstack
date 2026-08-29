import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/db/client";
import { saveGithubAppTokens } from "@/lib/db/github-app-tokens";
import { getProfileByClerkId } from "@/lib/db/profiles";
import { exchangeCode, githubAppConfigured } from "@/lib/github/app-oauth";

export const dynamic = "force-dynamic";

/**
 * Setup URL de la GitHub App (C-08): GitHub redirige aquí tras instalar (o
 * actualizar) la App. Registra la instalación en el perfil y, si viene `code`
 * (la App pide autorización durante la instalación), guarda también los
 * tokens de la estrella (C-07) — instalación + autorización en un solo viaje.
 * El webhook `installation` cubre además las instalaciones hechas sin sesión.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const destino = NextResponse.redirect(new URL("/settings/repos?app=connected", url.origin));

  try {
    const { userId } = await auth();
    if (!userId || !githubAppConfigured()) return destino;

    const db = createServiceClient();
    const profile = await getProfileByClerkId(db, userId);
    if (!profile) return destino;

    const installationId = Number(url.searchParams.get("installation_id"));
    if (Number.isFinite(installationId) && installationId > 0) {
      await db
        .from("profiles")
        .update({ github_installation_id: installationId })
        .eq("id", profile.id);
    }

    const code = url.searchParams.get("code");
    if (code) {
      const tokens = await exchangeCode(code);
      await saveGithubAppTokens(db, profile.id, tokens);
    }
  } catch (error) {
    // La instalación en GitHub ya ocurrió: el webhook la registrará igual.
    console.error("[github/setup]", error);
  }
  return destino;
}
