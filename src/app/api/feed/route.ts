import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/db/client";
import { annotateFollowed, listFeedPage } from "@/lib/db/feed-page";
import { listFollowedIds } from "@/lib/db/follows";
import { getProfileByClerkId } from "@/lib/db/profiles";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");
  const filter = url.searchParams.get("filter");

  try {
    const db = createServiceClient();

    const { userId } = await auth();
    const profile = userId ? await getProfileByClerkId(db, userId) : null;
    const followedIds = profile ? await listFollowedIds(db, profile.id) : null;

    if (filter === "following" && !profile) {
      return NextResponse.json({ error: "sign in required" }, { status: 401 });
    }

    let page = await listFeedPage(
      db,
      cursor,
      undefined,
      filter === "following" ? { ownerIn: followedIds ?? [] } : {},
    );
    if (followedIds && profile) page = annotateFollowed(page, new Set(followedIds), profile.id);

    return NextResponse.json(page);
  } catch (error) {
    console.error("[/api/feed]", error);
    return NextResponse.json({ error: "No se pudo cargar el feed" }, { status: 500 });
  }
}
