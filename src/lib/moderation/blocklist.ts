/**
 * Lista corta de términos inaceptables (S-01). Deliberadamente básica: cubre lo
 * inequívoco en inglés y español. Crece cuando la realidad lo pida; un servicio
 * de moderación completo sería sobreingeniería para v1 (decisión de ficha).
 */
export const BLOCKED_TERMS: readonly string[] = [
  // Slurs y odio inequívoco (en/es)
  "nigger",
  "nigga",
  "faggot",
  "tranny",
  "sudaca",
  "maricón",
  "maricon",
  // Contenido sexual explícito / abuso
  "porn",
  "porno",
  "hentai",
  "loli",
  "childporn",
  "zoofilia",
  // Nazismo explícito
  "heil hitler",
  "sieg heil",
];
