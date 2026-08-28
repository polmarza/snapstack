/**
 * Generación determinista del fondo de una ficha (M-04).
 *
 * La semilla es el hash FNV-1a del identificador del repo (github_repo_id cuando exista;
 * en fixtures, cualquier cadena estable). Mismo repo → misma semilla → mismo fondo, en
 * cualquier recarga y en cualquier máquina. La paleta se ancla al color oficial de GitHub
 * Linguist del lenguaje dominante para que las tarjetas del mismo stack sean coherentes.
 */

import { fnv1a, mulberry32 } from "./hash";
import { hexToHsl, hslToHex } from "./color";
import { languageColor } from "./linguist-colors";

export interface CardBlob {
  /** Posición del centro, en % del ancho/alto de la ficha. */
  cx: number;
  cy: number;
  /** Radio en % del ancho de la ficha. */
  r: number;
  color: string;
  opacity: number;
}

export interface CardBackground {
  /** Semilla determinista (hash FNV-1a en hexadecimal). Se persiste como `card_seed`. */
  seed: string;
  /** Color Linguist del lenguaje dominante (o el de reserva). */
  baseColor: string;
  /** Gradiente principal, de esquina a esquina según `angle`. */
  gradientFrom: string;
  gradientTo: string;
  angle: number;
  /** Manchas radiales translúcidas que dan textura sin romper la legibilidad. */
  blobs: CardBlob[];
}

/** Semilla determinista de un repo: hash FNV-1a del identificador, en hexadecimal. */
export function cardSeed(repoId: string): string {
  return fnv1a(repoId).toString(16).padStart(8, "0");
}

export function cardBackground(repoId: string, language: string | null): CardBackground {
  const seedNumber = fnv1a(repoId);
  const rng = mulberry32(seedNumber);
  const base = languageColor(language);
  const { h, s } = hexToHsl(base);

  // El gradiente vive en luminosidades bajas: el color identifica, el texto encima manda.
  const gradientFrom = hslToHex({ h, s: Math.min(s, 65), l: 14 + rng() * 6 });
  const hueShift = (rng() < 0.5 ? -1 : 1) * (12 + rng() * 24);
  const gradientTo = hslToHex({ h: h + hueShift, s: Math.min(s, 55), l: 24 + rng() * 8 });
  const angle = Math.round(rng() * 360);

  const blobCount = 2 + Math.floor(rng() * 2); // 2 o 3
  const blobs: CardBlob[] = Array.from({ length: blobCount }, () => ({
    cx: Math.round(rng() * 100),
    cy: Math.round(rng() * 100),
    r: Math.round(18 + rng() * 22),
    color: hslToHex({ h: h + (rng() - 0.5) * 40, s: Math.min(s + 10, 80), l: 45 + rng() * 15 }),
    opacity: 0.1 + rng() * 0.15,
  }));

  return { seed: cardSeed(repoId), baseColor: base, gradientFrom, gradientTo, angle, blobs };
}
