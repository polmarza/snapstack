/**
 * Hash FNV-1a de 32 bits sobre la representación UTF-8 de la cadena.
 * Es la base del determinismo de las fichas: mismo repo → misma semilla, siempre,
 * en cualquier runtime (no depende de Math.random ni de nada del entorno).
 */
export function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  const bytes = new TextEncoder().encode(input);
  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * PRNG mulberry32: secuencia pseudoaleatoria determinista a partir de una semilla.
 * Devuelve números en [0, 1). Cada ficha crea el suyo con su semilla; nunca se
 * comparte estado entre fichas.
 */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
