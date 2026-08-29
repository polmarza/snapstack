import type { Db } from "./client";
import type { SignalRow } from "@/lib/signals/events";

/** Inserta un lote de señales (M-09). Solo escritura: nadie las lee en v1. */
export async function insertSignals(db: Db, rows: SignalRow[]): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await db.from("signals").insert(rows);
  if (error) throw new Error(`Error al registrar señales: ${error.message}`);
}
