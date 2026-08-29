import { describe, it, expect } from "vitest";
import { fetchRepoReadme, README_MAX_LENGTH } from "./readme";

const respuesta = (body: unknown, status = 200) =>
  (async () =>
    new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;

const base64 = (text: string) => Buffer.from(text, "utf8").toString("base64");

describe("fetchRepoReadme", () => {
  it("C-05: decodifica el README y lo recorta al tope", async () => {
    const texto = "# Hola\n\nUn readme normal.";
    expect(await fetchRepoReadme("tok", "a/b", respuesta({ content: base64(texto), encoding: "base64" }))).toBe(texto);

    const largo = "x".repeat(README_MAX_LENGTH + 500);
    const resultado = await fetchRepoReadme("tok", "a/b", respuesta({ content: base64(largo), encoding: "base64" }));
    expect(resultado).toHaveLength(README_MAX_LENGTH);
  });

  it("C-05: sin README (404), contenido vacío o codificación rara → null, sin error", async () => {
    expect(await fetchRepoReadme("tok", "a/b", respuesta({}, 404))).toBeNull();
    expect(await fetchRepoReadme("tok", "a/b", respuesta({ content: base64("   "), encoding: "base64" }))).toBeNull();
    expect(await fetchRepoReadme("tok", "a/b", respuesta({ content: "x", encoding: "hex" }))).toBeNull();
  });

  it("C-05: un error real de la API sí lanza (para reintentarlo, no para tragarlo)", async () => {
    await expect(fetchRepoReadme("tok", "a/b", respuesta({}, 500))).rejects.toThrow("500");
  });

  it("S-01: un README con término bloqueado no se guarda", async () => {
    const conBloqueado = "# Proyecto\n\nContenido con porn dentro.";
    expect(
      await fetchRepoReadme("tok", "a/b", respuesta({ content: base64(conBloqueado), encoding: "base64" })),
    ).toBeNull();
  });
});
