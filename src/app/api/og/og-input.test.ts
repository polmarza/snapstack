import { describe, it, expect } from "vitest";
import { buildCardInput, MAX_DESCRIPTION_LENGTH } from "@/lib/card-seed";

/**
 * Se testea la composición del modelo de la ficha (función pura que consume el
 * endpoint /api/og). El render de Satori no se comprueba a nivel de píxel: ver
 * docs/testing.md y la ficha de la feature.
 */

const params = (entries: Record<string, string>) => new URLSearchParams(entries);

describe("buildCardInput", () => {
  it("M-04: compone nombre, descripción, lenguaje y fondo a partir de la petición", () => {
    const input = buildCardInput(
      params({ repoId: "1296269", name: "hello-world", description: "My first repo", language: "TypeScript" }),
    );
    expect(input.name).toBe("hello-world");
    expect(input.description).toBe("My first repo");
    expect(input.language).toBe("TypeScript");
    expect(input.languageColor).toBe("#3178c6");
    expect(input.background.seed).toMatch(/^[0-9a-f]{8}$/);
  });

  it("M-04: es determinista — misma petición, mismo modelo", () => {
    const a = buildCardInput(params({ repoId: "1296269", name: "hello-world", language: "Go" }));
    const b = buildCardInput(params({ repoId: "1296269", name: "hello-world", language: "Go" }));
    expect(a).toEqual(b);
  });

  it("M-04: la semilla se ancla al repoId, no al nombre (estable ante renombrados)", () => {
    const antes = buildCardInput(params({ repoId: "1296269", name: "nombre-viejo" }));
    const despues = buildCardInput(params({ repoId: "1296269", name: "nombre-nuevo" }));
    expect(despues.background).toEqual(antes.background);
  });

  it("M-04: sin repoId, la semilla cae al nombre", () => {
    const a = buildCardInput(params({ name: "solo-nombre" }));
    const b = buildCardInput(params({ name: "solo-nombre" }));
    expect(a.background).toEqual(b.background);
  });

  it("M-04: trunca la descripción larga y añade elipsis", () => {
    const larga = "x".repeat(500);
    const input = buildCardInput(params({ name: "repo", description: larga }));
    expect(input.description.length).toBeLessThanOrEqual(MAX_DESCRIPTION_LENGTH);
    expect(input.description.endsWith("…")).toBe(true);
  });

  it("M-04: respeta una descripción que ya cabe, sin tocarla", () => {
    const input = buildCardInput(params({ name: "repo", description: "corta y al grano" }));
    expect(input.description).toBe("corta y al grano");
  });

  it("M-04: sin lenguaje usa el color de reserva; sin nombre usa el genérico", () => {
    const input = buildCardInput(params({}));
    expect(input.name).toBe("repo");
    expect(input.language).toBeNull();
    expect(input.languageColor).toBe(input.background.baseColor);
  });
});
