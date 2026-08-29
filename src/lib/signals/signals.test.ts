import { describe, it, expect } from "vitest";
import {
  parseSignalsPayload,
  dwellValue,
  DWELL_MAX_MS,
  MAX_BATCH_SIZE,
} from "./events";

const REPO_UUID = "123e4567-e89b-42d3-a456-426614174000";

describe("parseSignalsPayload", () => {
  it("M-09: convierte un lote válido en filas con el profile_id de la sesión", () => {
    const rows = parseSignalsPayload(
      [
        { repoId: REPO_UUID, type: "expand" },
        { repoId: REPO_UUID, type: "click_repo" },
        { repoId: REPO_UUID, type: "dwell", value: 3500 },
      ],
      "perfil-1",
    );
    expect(rows).toHaveLength(3);
    expect(rows?.every((r) => r.profile_id === "perfil-1")).toBe(true);
    expect(rows?.[2]).toMatchObject({ type: "dwell", value: 3500 });
    expect(rows?.[0].value).toBeNull();
  });

  it("M-09: sin sesión, el profile_id queda NULL", () => {
    const rows = parseSignalsPayload([{ repoId: REPO_UUID, type: "expand" }], null);
    expect(rows?.[0].profile_id).toBeNull();
  });

  it("M-09: un payload que no es un lote válido se rechaza entero", () => {
    expect(parseSignalsPayload("no-array", null)).toBeNull();
    expect(parseSignalsPayload([], null)).toBeNull();
    expect(parseSignalsPayload({ repoId: REPO_UUID }, null)).toBeNull();
    const gigante = Array.from({ length: MAX_BATCH_SIZE + 1 }, () => ({ repoId: REPO_UUID, type: "expand" }));
    expect(parseSignalsPayload(gigante, null)).toBeNull();
  });

  it("M-09: los eventos individuales inválidos se descartan en silencio", () => {
    const rows = parseSignalsPayload(
      [
        { repoId: REPO_UUID, type: "expand" },
        { repoId: "no-es-uuid", type: "expand" },
        { repoId: REPO_UUID, type: "tipo-inventado" },
        { repoId: REPO_UUID, type: "dwell", value: 200 }, // bajo el umbral
        { repoId: REPO_UUID, type: "dwell" }, // dwell sin valor
        null,
      ],
      null,
    );
    expect(rows).toHaveLength(1);
  });

  it("M-09: el dwell se capa al máximo (pestañas olvidadas)", () => {
    const rows = parseSignalsPayload([{ repoId: REPO_UUID, type: "dwell", value: 999999999 }], null);
    expect(rows?.[0].value).toBe(DWELL_MAX_MS);
  });
});

describe("dwellValue", () => {
  it("M-09: descarta permanencias bajo el umbral y capa las largas", () => {
    expect(dwellValue(500)).toBeNull();
    expect(dwellValue(999)).toBeNull();
    expect(dwellValue(1000)).toBe(1000);
    expect(dwellValue(45000.7)).toBe(45001);
    expect(dwellValue(10 * 60 * 1000)).toBe(DWELL_MAX_MS);
    expect(dwellValue(NaN)).toBeNull();
  });
});
