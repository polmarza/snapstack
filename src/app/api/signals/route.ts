import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/db/client";
import { getProfileByClerkId } from "@/lib/db/profiles";
import { insertSignals } from "@/lib/db/signals";
import { parseSignalsPayload } from "@/lib/signals/events";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  try {
    const db = createServiceClient();

    // El profile_id sale de la sesión, nunca del payload del cliente.
    const { userId } = await auth();
    const profile = userId ? await getProfileByClerkId(db, userId) : null;

    const rows = parseSignalsPayload(payload, profile?.id ?? null);
    if (rows === null) return NextResponse.json({ error: "invalid payload" }, { status: 400 });

    // Filas con repo inexistente las rechaza la FK; el lote entero no debe caer por eso.
    try {
      await insertSignals(db, rows);
    } catch {
      return NextResponse.json({ accepted: 0 }, { status: 202 });
    }
    return NextResponse.json({ accepted: rows.length }, { status: 202 });
  } catch (error) {
    console.error("[/api/signals]", error);
    // El registro nunca es un problema del usuario.
    return NextResponse.json({ accepted: 0 }, { status: 202 });
  }
}
