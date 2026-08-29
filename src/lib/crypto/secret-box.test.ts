import { describe, it, expect, beforeEach } from "vitest";
import { encryptSecret, decryptSecret } from "./secret-box";

const KEY_A = "a".repeat(64);
const KEY_B = "b".repeat(64);

describe("secret-box", () => {
  beforeEach(() => {
    process.env.GITHUB_TOKEN_ENCRYPTION_KEY = KEY_A;
  });

  it("C-07: cifra y descifra ida y vuelta, con IV distinto cada vez", () => {
    const box1 = encryptSecret("ghu_token_secreto");
    const box2 = encryptSecret("ghu_token_secreto");
    expect(box1).not.toBe(box2); // IV aleatorio: mismo texto, cajas distintas
    expect(decryptSecret(box1)).toBe("ghu_token_secreto");
    expect(decryptSecret(box2)).toBe("ghu_token_secreto");
  });

  it("seguridad: un byte manipulado hace fallar el descifrado (GCM autentica)", () => {
    const box = encryptSecret("ghu_token_secreto");
    const raw = Buffer.from(box, "base64url");
    raw[raw.length - 1] ^= 0xff;
    expect(() => decryptSecret(raw.toString("base64url"))).toThrow();
  });

  it("seguridad: otra clave no descifra, y una clave malformada se rechaza", () => {
    const box = encryptSecret("ghu_token_secreto");
    process.env.GITHUB_TOKEN_ENCRYPTION_KEY = KEY_B;
    expect(() => decryptSecret(box)).toThrow();
    process.env.GITHUB_TOKEN_ENCRYPTION_KEY = "corta";
    expect(() => encryptSecret("x")).toThrow("32 bytes");
  });
});
