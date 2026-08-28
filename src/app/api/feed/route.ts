import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db/client";
import { listFeedPage } from "@/lib/db/feed-page";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cursor = new URL(request.url).searchParams.get("cursor");
  try {
    const page = await listFeedPage(createServiceClient(), cursor);
    return NextResponse.json(page);
  } catch (error) {
    console.error("[/api/feed]", error);
    return NextResponse.json({ error: "No se pudo cargar el feed" }, { status: 500 });
  }
}
