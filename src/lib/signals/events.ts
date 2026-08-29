/**
 * Tipos y validación de las señales implícitas (M-09). La validación corre en
 * servidor: el cliente es entrada no confiable.
 */

export const SIGNAL_TYPES = ["dwell", "expand", "click_repo", "follow_author"] as const;
export type SignalType = (typeof SIGNAL_TYPES)[number];

export const MAX_BATCH_SIZE = 50;
export const DWELL_MIN_MS = 1_000;
export const DWELL_MAX_MS = 120_000;

/** Evento tal y como lo manda el cliente. */
export interface SignalEvent {
  repoId: string; // uuid interno del repo
  type: SignalType;
  value?: number; // ms de permanencia; solo en dwell
}

/** Fila lista para insertar (el profile_id lo pone el servidor desde la sesión). */
export interface SignalRow {
  profile_id: string | null;
  repo_id: string;
  type: SignalType;
  value: number | null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Valida el payload del cliente y lo convierte en filas. Devuelve null si el
 * payload no es un lote válido; los eventos individualmente inválidos se
 * descartan en silencio (el registro nunca es motivo de error para el usuario).
 */
export function parseSignalsPayload(payload: unknown, profileId: string | null): SignalRow[] | null {
  if (!Array.isArray(payload) || payload.length === 0 || payload.length > MAX_BATCH_SIZE) {
    return null;
  }

  const rows: SignalRow[] = [];
  for (const item of payload) {
    if (typeof item !== "object" || item === null) continue;
    const { repoId, type, value } = item as Record<string, unknown>;

    if (typeof repoId !== "string" || !UUID_RE.test(repoId)) continue;
    if (typeof type !== "string" || !SIGNAL_TYPES.includes(type as SignalType)) continue;

    let cleanValue: number | null = null;
    if (type === "dwell") {
      if (typeof value !== "number" || !Number.isFinite(value) || value < DWELL_MIN_MS) continue;
      cleanValue = Math.min(Math.round(value), DWELL_MAX_MS);
    }

    rows.push({ profile_id: profileId, repo_id: repoId, type: type as SignalType, value: cleanValue });
  }

  return rows;
}

/**
 * Acumulador de permanencia por tarjeta: suma tramos visibles y decide si la
 * permanencia total merece señal (umbral) y con qué valor (cap).
 */
export function dwellValue(totalMs: number): number | null {
  if (!Number.isFinite(totalMs) || totalMs < DWELL_MIN_MS) return null;
  return Math.min(Math.round(totalMs), DWELL_MAX_MS);
}
