import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db/client";
import { handleGithubEvent, verifyGithubSignature } from "@/lib/github/webhooks";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[/api/webhooks/github] GITHUB_WEBHOOK_SECRET sin configurar");
    return NextResponse.json({ error: "webhook not configured" }, { status: 503 });
  }

  // La firma se calcula sobre el cuerpo crudo: leer antes de parsear.
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  if (!verifyGithubSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const eventName = request.headers.get("x-github-event") ?? "";
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  try {
    const result = await handleGithubEvent(createServiceClient(), eventName, payload);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[/api/webhooks/github]", error);
    // 500 → GitHub reintenta la entrega.
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
}
