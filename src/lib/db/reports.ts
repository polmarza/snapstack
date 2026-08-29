import type { Db } from "./client";

export const MAX_REPORT_REASON_LENGTH = 500;

/**
 * Registra un reporte (S-01). Un reporte por usuario y repo: los duplicados se
 * ignoran en silencio (índice único en la migración 005).
 */
export async function insertReport(
  db: Db,
  report: { reporter_id: string; repo_id: string; reason: string },
): Promise<void> {
  const reason = report.reason.trim().slice(0, MAX_REPORT_REASON_LENGTH);
  if (reason.length === 0) throw new Error("El reporte necesita un motivo");

  const { error } = await db
    .from("reports")
    .upsert(
      { reporter_id: report.reporter_id, repo_id: report.repo_id, reason },
      { onConflict: "reporter_id,repo_id", ignoreDuplicates: true },
    );
  if (error) throw new Error(`Error al registrar el reporte: ${error.message}`);
}
