"use server";

import { currentUser } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/db/client";
import { getProfileByClerkId } from "@/lib/db/profiles";
import { setSubscription } from "@/lib/db/subscriptions";

export interface SubscribeResult {
  ok: boolean;
  subscribed: boolean;
  error: string | null;
}

/** Toggle de suscripción a un repo (C-06). Exige sesión. */
export async function setSubscriptionAction(
  repoId: string,
  subscribed: boolean,
): Promise<SubscribeResult> {
  try {
    const user = await currentUser();
    if (!user) return { ok: false, subscribed: !subscribed, error: "Sign in to subscribe." };

    const db = createServiceClient();
    const profile = await getProfileByClerkId(db, user.id);
    if (!profile) return { ok: false, subscribed: !subscribed, error: "We couldn't find your profile." };

    await setSubscription(db, profile.id, repoId, subscribed);
    return { ok: true, subscribed, error: null };
  } catch (error) {
    console.error("[setSubscriptionAction]", error);
    return { ok: false, subscribed: !subscribed, error: "Something went wrong. Please try again." };
  }
}
