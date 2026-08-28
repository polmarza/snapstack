/**
 * Composición del modelo de una ficha a partir de los parámetros de la petición.
 *
 * Es una función pura y es lo que se testea del endpoint OG: el render en sí (Satori)
 * no se comprueba a nivel de píxel (ver docs/testing.md).
 */

import { cardBackground, type CardBackground } from "./card-seed";
import { languageColor } from "./linguist-colors";

export const MAX_DESCRIPTION_LENGTH = 140;

export interface CardInput {
  name: string;
  description: string;
  language: string | null;
  languageColor: string;
  background: CardBackground;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

export function buildCardInput(params: URLSearchParams): CardInput {
  const name = params.get("name")?.trim() || "repo";
  // La semilla se ancla al ID del repo (estable ante renombrados); si no llega, al nombre.
  const repoId = params.get("repoId")?.trim() || name;
  const language = params.get("language")?.trim() || null;
  const description = truncate(params.get("description")?.trim() ?? "", MAX_DESCRIPTION_LENGTH);

  return {
    name,
    description,
    language,
    languageColor: languageColor(language),
    background: cardBackground(repoId, language),
  };
}
