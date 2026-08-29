"use server";

import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/db/client";
import { setFollowing, SelfFollowError } from "@/lib/db/follows";
import { ensureProfile, getProfileByClerkId } from "@/lib/db/profiles";

export interface FollowResult {
  ok: boolean;
  following: boolean;
  error: string | null;
}

/** Toggle de follow (M-07). Exige sesión; el follower sale de ella. */
export async function setFollowingAction(
  followedProfileId: string,
  following: boolean,
): Promise<FollowResult> {
  try {
    const user = await currentUser();
    if (!user) return { ok: false, following: !following, error: "Sign in to follow devs." };

    const db = createServiceClient();
    await ensureProfile(db, user);
    const profile = await getProfileByClerkId(db, user.id);
    if (!profile) return { ok: false, following: !following, error: "We couldn't find your profile." };

    await setFollowing(db, profile.id, followedProfileId, following);
    revalidatePath("/");
    return { ok: true, following, error: null };
  } catch (error) {
    if (error instanceof SelfFollowError) {
      return { ok: false, following: false, error: error.message };
    }
    console.error("[setFollowingAction]", error);
    return { ok: false, following: !following, error: "Something went wrong. Please try again." };
  }
}
