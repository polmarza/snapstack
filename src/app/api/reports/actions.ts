"use server";

import { currentUser } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/db/client";
import { ensureProfile, getProfileByClerkId } from "@/lib/db/profiles";
import { insertReport } from "@/lib/db/reports";

export interface ReportResult {
  ok: boolean;
  error: string | null;
}

/** Reporta una ficha (S-01). Exige sesión; el reporter sale de ella, no del payload. */
export async function reportRepoAction(repoId: string, reason: string): Promise<ReportResult> {
  try {
    const user = await currentUser();
    if (!user) return { ok: false, error: "Sign in to report content." };

    const db = createServiceClient();
    await ensureProfile(db, user);
    const profile = await getProfileByClerkId(db, user.id);
    if (!profile) return { ok: false, error: "We couldn't find your profile." };

    if (!reason.trim()) return { ok: false, error: "Please tell us what's wrong." };

    await insertReport(db, { reporter_id: profile.id, repo_id: repoId, reason });
    return { ok: true, error: null };
  } catch (error) {
    console.error("[reportRepoAction]", error);
    return { ok: false, error: "We couldn't submit the report. Please try again." };
  }
}
