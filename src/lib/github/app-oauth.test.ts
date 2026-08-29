import { describe, it, expect, beforeEach } from "vitest";
import { buildAuthorizeUrl, exchangeCode, refreshAccessToken, githubAppConfigured } from "./app-oauth";

const respuesta = (body: unknown, status = 200) =>
  (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;

describe("app-oauth", () => {
  beforeEach(() => {
    process.env.GITHUB_APP_CLIENT_ID = "Iv1.test";
    process.env.GITHUB_APP_CLIENT_SECRET = "secreto";
  });

  it("C-07: la URL de autorización lleva client_id, state y redirect", () => {
    const url = new URL(buildAuthorizeUrl("estado123", "https://snapstack.sh/api/github/callback"));
    expect(url.origin + url.pathname).toBe("https://github.com/login/oauth/authorize");
    expect(url.searchParams.get("client_id")).toBe("Iv1.test");
    expect(url.searchParams.get("state")).toBe("estado123");
    expect(url.searchParams.get("redirect_uri")).toBe("https://snapstack.sh/api/github/callback");
  });

  it("C-07: el canje devuelve tokens y calcula la expiración; sin expires_in, no expira", async () => {
    const conExpiracion = await exchangeCode(
      "code1",
      respuesta({ access_token: "ghu_x", refresh_token: "ghr_y", expires_in: 28800 }),
    );
    expect(conExpiracion.accessToken).toBe("ghu_x");
    expect(conExpiracion.refreshToken).toBe("ghr_y");
    expect(conExpiracion.accessExpiresAt).not.toBeNull();

    const sinExpiracion = await exchangeCode("code2", respuesta({ access_token: "ghu_z" }));
    expect(sinExpiracion.refreshToken).toBeNull();
    expect(sinExpiracion.accessExpiresAt).toBeNull();
  });

  it("C-07: un canje rechazado o un error HTTP lanzan con el detalle", async () => {
    await expect(
      exchangeCode("malo", respuesta({ error: "bad_verification_code", error_description: "code caducado" })),
    ).rejects.toThrow("code caducado");
    await expect(refreshAccessToken("ghr", respuesta({}, 500))).rejects.toThrow("500");
  });

  it("el interruptor: sin client id/secret la feature queda apagada", () => {
    expect(githubAppConfigured()).toBe(true);
    delete process.env.GITHUB_APP_CLIENT_SECRET;
    expect(githubAppConfigured()).toBe(false);
  });
});
