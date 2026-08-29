import { describe, it, expect } from "vitest";
import type { Db } from "./client";
import { insertReport, MAX_REPORT_REASON_LENGTH } from "./reports";

function fakeDb() {
  const upserts: Array<{ row: Record<string, unknown>; opts: Record<string, unknown> }> = [];
  const db = {
    from: (table: string) => ({
      upsert: (row: Record<string, unknown>, opts: Record<string, unknown>) => {
        expect(table).toBe("reports");
        upserts.push({ row, opts });
        return Promise.resolve({ error: null });
      },
    }),
  } as unknown as Db;
  return { db, upserts };
}

describe("insertReport", () => {
  it("S-01: registra el reporte deduplicando por usuario y repo", async () => {
    const { db, upserts } = fakeDb();
    await insertReport(db, { reporter_id: "p1", repo_id: "r1", reason: "spam disguised as a repo" });

    expect(upserts).toHaveLength(1);
    expect(upserts[0].row.reason).toBe("spam disguised as a repo");
    expect(upserts[0].opts).toMatchObject({
      onConflict: "reporter_id,repo_id",
      ignoreDuplicates: true,
    });
  });

  it("S-01: recorta el motivo al máximo y rechaza el vacío", async () => {
    const { db, upserts } = fakeDb();
    await insertReport(db, { reporter_id: "p1", repo_id: "r1", reason: "x".repeat(2000) });
    expect((upserts[0].row.reason as string).length).toBe(MAX_REPORT_REASON_LENGTH);

    await expect(insertReport(db, { reporter_id: "p1", repo_id: "r1", reason: "   " })).rejects.toThrow(
      "motivo",
    );
  });
});
