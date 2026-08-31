"use server";

import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/db/client";
import { createNote, deleteNote, NoteValidationError } from "@/lib/db/notes";
import { notifyNewNote } from "@/lib/db/notifications";
import { ensureProfile, getProfileByClerkId } from "@/lib/db/profiles";
import { listSubscriberIds } from "@/lib/db/subscriptions";

export interface NoteActionResult {
  ok: boolean;
  error: string | null;
}

/**
 * Publica una nota (C-09). El autor sale de la sesión, nunca del cliente, y el
 * anclaje al repo lo valida `createNote` contra la base.
 */
export async function createNoteAction(repoId: string, body: string): Promise<NoteActionResult> {
  try {
    const user = await currentUser();
    if (!user) return { ok: false, error: "Sign in to write a note." };

    const db = createServiceClient();
    await ensureProfile(db, user);
    const profile = await getProfileByClerkId(db, user.id);
    if (!profile) return { ok: false, error: "We couldn't find your profile." };

    const note = await createNote(db, profile.id, repoId, body);

    // Los avisos nunca rompen la publicación: si fallan, se loguean y ya.
    try {
      const subscribers = await listSubscriberIds(db, repoId);
      const { data: repo } = await db
        .from("repos")
        .select("full_name")
        .eq("id", repoId)
        .maybeSingle();
      const fullName = (repo as { full_name: string } | null)?.full_name ?? "";
      await Promise.all(
        subscribers.map((recipient) =>
          notifyNewNote(db, recipient, profile.id, {
            note_id: note.id,
            repo_id: repoId,
            full_name: fullName,
            excerpt: note.body.slice(0, 140),
          }),
        ),
      );
    } catch (error) {
      console.error("[createNoteAction] notificaciones", error);
    }

    revalidatePath("/");
    revalidatePath(`/u/${profile.username}`);
    return { ok: true, error: null };
  } catch (error) {
    if (error instanceof NoteValidationError) return { ok: false, error: error.message };
    console.error("[createNoteAction]", error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

/** Borra una nota propia. Que sea propia lo impone la consulta, no esta capa. */
export async function deleteNoteAction(noteId: string): Promise<NoteActionResult> {
  try {
    const user = await currentUser();
    if (!user) return { ok: false, error: "Sign in first." };

    const db = createServiceClient();
    const profile = await getProfileByClerkId(db, user.id);
    if (!profile) return { ok: false, error: "We couldn't find your profile." };

    const deleted = await deleteNote(db, profile.id, noteId);
    if (!deleted) return { ok: false, error: "That note isn't yours." };

    revalidatePath("/");
    revalidatePath(`/u/${profile.username}`);
    return { ok: true, error: null };
  } catch (error) {
    console.error("[deleteNoteAction]", error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
