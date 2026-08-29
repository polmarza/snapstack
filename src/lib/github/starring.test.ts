import { describe, it, expect } from "vitest";
import { isStarred, setStar, GithubTokenRevokedError } from "./starring";

const respuesta = (status: number) =>
  (async () => new Response(null, { status })) as unknown as typeof fetch;

describe("starring", () => {
  it("C-07: isStarred distingue 204 (sí) de 404 (no)", async () => {
    expect(await isStarred("tok", "a/b", respuesta(204))).toBe(true);
    expect(await isStarred("tok", "a/b", respuesta(404))).toBe(false);
  });

  it("C-07: setStar acepta el 204 y usa PUT o DELETE según el sentido", async () => {
    const metodos: string[] = [];
    const espia = (async (_url: RequestInfo | URL, init?: RequestInit) => {
      metodos.push(init?.method ?? "GET");
      return new Response(null, { status: 204 });
    }) as unknown as typeof fetch;
    await setStar("tok", "a/b", true, espia);
    await setStar("tok", "a/b", false, espia);
    expect(metodos).toEqual(["PUT", "DELETE"]);
  });

  it("C-07: un 401 se señala como token revocado (para reconectar)", async () => {
    await expect(isStarred("tok", "a/b", respuesta(401))).rejects.toThrow(GithubTokenRevokedError);
    await expect(setStar("tok", "a/b", true, respuesta(401))).rejects.toThrow(GithubTokenRevokedError);
  });

  it("seguridad: un full_name raro no llega a componer la URL", async () => {
    for (const raro of ["a/b/../c", "a b/c", "a/b?x=1", "../etc", "a"]) {
      await expect(setStar("tok", raro, true, respuesta(204)), raro).rejects.toThrow("full_name");
    }
  });
});
