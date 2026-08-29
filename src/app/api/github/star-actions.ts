"use server";

import { currentUser } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/db/client";
import { deleteGithubAppTokens, getGithubAppToken } from "@/lib/db/github-app-tokens";
import { getProfileByClerkId } from "@/lib/db/profiles";
import { GithubMissingPermissionError, GithubTokenRevokedError, setStar } from "@/lib/github/starring";

export interface StarResult {
  ok: boolean;
  starred: boolean;
  /** true → el cliente debe llevar al usuario a /api/github/connect. */
  needsConnect: boolean;
  error: string | null;
  /** Dónde se arregla el error, si tiene arreglo: el aviso pinta un botón. */
  fixUrl?: string;
  fixLabel?: string;
}

/** Da o quita la estrella real en GitHub (C-07). */
export async function setStarAction(fullName: string, starred: boolean): Promise<StarResult> {
  const fallo = (error: string, fix?: { url: string; label: string }): StarResult => ({
    ok: false,
    starred: !starred,
    needsConnect: false,
    error,
    ...(fix ? { fixUrl: fix.url, fixLabel: fix.label } : {}),
  });

  try {
    const user = await currentUser();
    if (!user) return fallo("Sign in to star repos.");

    const db = createServiceClient();
    const profile = await getProfileByClerkId(db, user.id);
    if (!profile) return fallo("We couldn't find your profile.");

    const token = await getGithubAppToken(db, profile.id);
    if (!token) return { ok: false, starred: !starred, needsConnect: true, error: null };

    try {
      await setStar(token, fullName, starred);
    } catch (error) {
      if (error instanceof GithubTokenRevokedError) {
        // Token revocado en GitHub: fuera de la base y a reconectar.
        await deleteGithubAppTokens(db, profile.id);
        return { ok: false, starred: !starred, needsConnect: true, error: null };
      }
      if (error instanceof GithubMissingPermissionError) {
        return fallo(
          "GitHub blocked this: the app's Starring permission is waiting for your approval.",
          { url: "https://github.com/settings/installations", label: "Review on GitHub" },
        );
      }
      throw error;
    }

    return { ok: true, starred, needsConnect: false, error: null };
  } catch (error) {
    console.error("[setStarAction]", error);
    return fallo("Something went wrong. Please try again.");
  }
}
