"use server";

import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/db/client";
import { getProfileByClerkId } from "@/lib/db/profiles";
import { findBlockedTerm } from "@/lib/moderation/moderation";
import {
  BIO_MAX_LENGTH,
  normalizeSocialLinks,
  TAGLINE_MAX_LENGTH,
  type SocialPlatformKey,
} from "@/lib/profile/social-links";

export interface SaveProfileResult {
  ok: boolean;
  error: string | null;
  /** Errores por enlace inválido, con la clave de su plataforma. */
  linkErrors: Partial<Record<SocialPlatformKey, string>>;
}

/**
 * Guarda tagline, bio y enlaces sociales (C-03). Todo opcional: vacío borra.
 * La validación vive aquí, en servidor — el formulario solo acompaña.
 */
export async function saveProfileAction(
  taglineRaw: string,
  bioRaw: string,
  linksRaw: Record<string, string>,
): Promise<SaveProfileResult> {
  const fallo = (error: string): SaveProfileResult => ({ ok: false, error, linkErrors: {} });

  try {
    const user = await currentUser();
    if (!user) return fallo("Invalid session. Please sign in again.");

    const tagline = taglineRaw.trim().slice(0, TAGLINE_MAX_LENGTH * 2);
    const bio = bioRaw.trim().slice(0, BIO_MAX_LENGTH * 2);
    if (tagline.length > TAGLINE_MAX_LENGTH) {
      return fallo(`The tagline can't exceed ${TAGLINE_MAX_LENGTH} characters.`);
    }
    if (bio.length > BIO_MAX_LENGTH) {
      return fallo(`The bio can't exceed ${BIO_MAX_LENGTH} characters.`);
    }

    // Mismo filtro de contenido que los repos al importar (S-01).
    if (findBlockedTerm(tagline, bio) !== null) {
      return fallo("Your tagline or bio doesn't meet the content policy.");
    }

    const { links, errors } = normalizeSocialLinks(linksRaw);
    if (Object.keys(errors).length > 0) {
      return { ok: false, error: "Some links need a fix before saving.", linkErrors: errors };
    }

    const db = createServiceClient();
    const profile = await getProfileByClerkId(db, user.id);
    if (!profile) return fallo("We couldn't find your profile.");

    const { error } = await db
      .from("profiles")
      .update({
        tagline: tagline || null,
        bio: bio || null,
        social_links: links,
      })
      .eq("id", profile.id);
    if (error) throw new Error(`Error al guardar el perfil: ${error.message}`);

    revalidatePath(`/u/${profile.username}`);
    revalidatePath("/settings/account");
    return { ok: true, error: null, linkErrors: {} };
  } catch (error) {
    console.error("[saveProfileAction]", error);
    return fallo("We couldn't save your profile. Please try again.");
  }
}
