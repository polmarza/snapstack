"use server";

import { currentUser } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/db/client";
import { markAllNotificationsRead } from "@/lib/db/notifications";
import { getProfileByClerkId } from "@/lib/db/profiles";

/** Abrir /notifications marca todo leído (C-04). Silenciosa: sin resultado que pintar. */
export async function markNotificationsReadAction(): Promise<void> {
  try {
    const user = await currentUser();
    if (!user) return;
    const db = createServiceClient();
    const profile = await getProfileByClerkId(db, user.id);
    if (!profile) return;
    await markAllNotificationsRead(db, profile.id);
  } catch (error) {
    console.error("[markNotificationsReadAction]", error);
  }
}
