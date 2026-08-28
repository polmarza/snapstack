import { describe, it, expect } from "vitest";
import { fnv1a, mulberry32 } from "./hash";
import { hexToHsl } from "./color";
import { languageColor, FALLBACK_COLOR } from "./linguist-colors";
import { cardSeed, cardBackground } from "./card-seed";

describe("fnv1a", () => {
  it("M-04: devuelve el offset basis de FNV-1a para la cadena vacía", () => {
    expect(fnv1a("")).toBe(0x811c9dc5);
  });

  it("M-04: es determinista para el mismo input", () => {
    expect(fnv1a("1296269")).toBe(fnv1a("1296269"));
  });

  it("M-04: distingue inputs distintos", () => {
    expect(fnv1a("1296269")).not.toBe(fnv1a("1296270"));
  });
});

describe("mulberry32", () => {
  it("M-04: produce la misma secuencia para la misma semilla", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const secuenciaA = [a(), a(), a(), a()];
    const secuenciaB = [b(), b(), b(), b()];
    expect(secuenciaA).toEqual(secuenciaB);
  });

  it("M-04: los valores quedan en [0, 1)", () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("languageColor", () => {
  it("M-04: devuelve el color oficial de Linguist para lenguajes conocidos", () => {
    expect(languageColor("TypeScript")).toBe("#3178c6");
    expect(languageColor("Python")).toBe("#3572A5");
    expect(languageColor("Rust")).toBe("#dea584");
  });

  it("M-04: devuelve el color de reserva para lenguaje desconocido o ausente", () => {
    expect(languageColor("LenguajeInventado")).toBe(FALLBACK_COLOR);
    expect(languageColor(null)).toBe(FALLBACK_COLOR);
    expect(languageColor(undefined)).toBe(FALLBACK_COLOR);
  });
});

describe("cardSeed", () => {
  it("M-04: mismo repo → misma semilla, siempre", () => {
    expect(cardSeed("1296269")).toBe(cardSeed("1296269"));
  });

  it("M-04: la semilla es hexadecimal de 8 caracteres", () => {
    expect(cardSeed("1296269")).toMatch(/^[0-9a-f]{8}$/);
  });
});

describe("cardBackground", () => {
  it("M-04: mismo repo → mismo fondo completo en llamadas repetidas", () => {
    const a = cardBackground("1296269", "TypeScript");
    const b = cardBackground("1296269", "TypeScript");
    expect(a).toEqual(b);
  });

  it("M-04: repos distintos del mismo lenguaje → fondos distintos", () => {
    const a = cardBackground("1296269", "TypeScript");
    const b = cardBackground("83222441", "TypeScript");
    expect(a.gradientFrom !== b.gradientFrom || a.angle !== b.angle).toBe(true);
  });

  it("M-04: la paleta se ancla al color Linguist del lenguaje dominante", () => {
    const fondo = cardBackground("1296269", "TypeScript");
    expect(fondo.baseColor).toBe("#3178c6");
    // El gradiente principal conserva el tono del color del lenguaje.
    const hueBase = hexToHsl("#3178c6").h;
    const hueFrom = hexToHsl(fondo.gradientFrom).h;
    expect(Math.abs(hueFrom - hueBase)).toBeLessThan(2);
  });

  it("M-04: sin lenguaje, el fondo usa el color de reserva", () => {
    expect(cardBackground("sin-lenguaje", null).baseColor).toBe(FALLBACK_COLOR);
  });

  it("M-04: el gradiente vive en luminosidades bajas para que el texto sea legible", () => {
    for (const repoId of ["1296269", "4164482", "27193779"]) {
      const fondo = cardBackground(repoId, "Rust");
      expect(hexToHsl(fondo.gradientFrom).l).toBeLessThan(30);
      expect(hexToHsl(fondo.gradientTo).l).toBeLessThan(40);
    }
  });

  it("M-04: genera 2 o 3 manchas con opacidad discreta", () => {
    const fondo = cardBackground("1296269", "Go");
    expect(fondo.blobs.length).toBeGreaterThanOrEqual(2);
    expect(fondo.blobs.length).toBeLessThanOrEqual(3);
    for (const blob of fondo.blobs) {
      expect(blob.opacity).toBeGreaterThan(0);
      expect(blob.opacity).toBeLessThanOrEqual(0.25);
    }
  });
});
