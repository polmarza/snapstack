import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * Cifrado simétrico para secretos en la base (C-07): AES-256-GCM con la clave
 * de `GITHUB_TOKEN_ENCRYPTION_KEY` (32 bytes en hex, `openssl rand -hex 32`).
 * Formato: base64url(iv ‖ authTag ‖ ciphertext). El GCM autentica: un byte
 * manipulado hace fallar el descifrado en vez de devolver basura.
 */

const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function key(): Buffer {
  const hex = process.env.GITHUB_TOKEN_ENCRYPTION_KEY ?? "";
  if (!/^[0-9a-f]{64}$/i.test(hex)) {
    throw new Error("GITHUB_TOKEN_ENCRYPTION_KEY debe ser 32 bytes en hex (openssl rand -hex 32)");
  }
  return Buffer.from(hex, "hex");
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString("base64url");
}

export function decryptSecret(box: string): string {
  const raw = Buffer.from(box, "base64url");
  const iv = raw.subarray(0, IV_LENGTH);
  const tag = raw.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = raw.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
