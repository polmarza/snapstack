import { BLOCKED_TERMS } from "./blocklist";

/**
 * Filtro básico de contenido (S-01). Coincidencia por límites de palabra para
 * que "class" no caiga por contener "ass"; los nombres de repo se comparan
 * también partidos por separadores comunes (guiones, barras bajas, puntos).
 */

const normalize = (text: string): string =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

const PATTERNS: Array<{ term: string; re: RegExp }> = BLOCKED_TERMS.map((term) => ({
  term,
  re: new RegExp(`(^|[^a-z0-9])${normalize(term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^a-z0-9])`),
}));

/** Devuelve el término bloqueado encontrado, o null si el contenido es aceptable. */
export function findBlockedTerm(...texts: Array<string | null | undefined>): string | null {
  // Los separadores típicos de nombres de repo se vuelven espacios para que
  // "algo-porn-x" no esquive el límite de palabra.
  const haystack = normalize(texts.filter(Boolean).join(" ")).replace(/[-_./]/g, " ");
  for (const { term, re } of PATTERNS) {
    if (re.test(haystack)) return term;
  }
  return null;
}

/** Conveniencia para repos: nombre + descripción + topics. */
export function repoBlockedTerm(repo: {
  full_name: string;
  description: string | null;
  topics: string[];
}): string | null {
  return findBlockedTerm(repo.full_name, repo.description, ...repo.topics);
}
