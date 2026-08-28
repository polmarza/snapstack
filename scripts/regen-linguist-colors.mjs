#!/usr/bin/env node
/**
 * Regenera `src/lib/card-seed/linguist-colors.ts` desde el languages.yml oficial de
 * GitHub Linguist. Ejecutar cuando haga falta refrescar los colores (no tiene cadencia:
 * los colores de Linguist cambian muy poco).
 *
 * Uso:  pnpm regen:linguist
 */

import { writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const URL_YML =
  'https://raw.githubusercontent.com/github-linguist/linguist/main/lib/linguist/languages.yml';
const DESTINO = join(
  resolve(dirname(fileURLToPath(import.meta.url)), '..'),
  'src', 'lib', 'card-seed', 'linguist-colors.ts',
);

const res = await fetch(URL_YML);
if (!res.ok) {
  console.error(`No se pudo descargar languages.yml: ${res.status} ${res.statusText}`);
  process.exit(1);
}
const yml = await res.text();

// languages.yml es YAML plano de dos niveles: nombre de lenguaje sin indentar,
// campos con dos espacios. Con eso basta un parseo por líneas, sin dependencia de YAML.
const colores = {};
let actual = null;
for (const linea of yml.split('\n')) {
  const lang = linea.match(/^([^\s#][^:]*):\s*$/);
  if (lang) {
    actual = lang[1].replace(/^"|"$/g, '');
    continue;
  }
  const color = linea.match(/^\s{2}color:\s*"(#[0-9A-Fa-f]{6})"\s*$/);
  if (color && actual) colores[actual] = color[1];
}

const entradas = Object.entries(colores);
if (entradas.length < 400) {
  console.error(`Solo se han extraído ${entradas.length} colores: el formato ha debido cambiar.`);
  process.exit(1);
}

const cuerpo = entradas.map(([k, v]) => `  ${JSON.stringify(k)}: "${v}",`).join('\n');
const ts = `/**
 * Colores oficiales de lenguaje de GitHub Linguist, vendorizados desde
 * https://github.com/github-linguist/linguist (lib/linguist/languages.yml).
 * Regenerar con: pnpm regen:linguist (ver scripts/regen-linguist-colors.mjs).
 */
export const LINGUIST_COLORS: Record<string, string> = {
${cuerpo}
};

/** Color de reserva para lenguajes sin color declarado o desconocidos. */
export const FALLBACK_COLOR = "#6e7681";

export function languageColor(language: string | null | undefined): string {
  if (!language) return FALLBACK_COLOR;
  return LINGUIST_COLORS[language] ?? FALLBACK_COLOR;
}
`;

writeFileSync(DESTINO, ts);
console.log(`Escrito ${DESTINO} con ${entradas.length} lenguajes.`);
