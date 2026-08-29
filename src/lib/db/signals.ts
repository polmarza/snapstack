import type { Db } from "./client";
import type { SignalRow } from "@/lib/signals/events";

/**
 * Inserta un lote de señales (M-09) y mantiene al día el contador de clicks del
 * repo, que la tarjeta muestra.
 *
 * El contador se incrementa por RPC (`increment_repo_clicks`) para que la suma
 * ocurra dentro de la base: leer-sumar-escribir desde aquí perdería clicks
 * simultáneos. Si el incremento falla, la señal ya está guardada y el contador
 * puede recalcularse desde `signals`: no se pierde información.
 */
export async function insertSignals(db: Db, rows: SignalRow[]): Promise<void> {
  if (rows.length === 0) return;

  const { error } = await db.from("signals").insert(rows);
  if (error) throw new Error(`Error al registrar señales: ${error.message}`);

  const clicksPorRepo = new Map<string, number>();
  for (const row of rows) {
    if (row.type !== "click_repo") continue;
    clicksPorRepo.set(row.repo_id, (clicksPorRepo.get(row.repo_id) ?? 0) + 1);
  }

  await Promise.all(
    [...clicksPorRepo].map(([repoId, delta]) =>
      db.rpc("increment_repo_clicks", { p_repo_id: repoId, p_delta: delta }),
    ),
  );
}
