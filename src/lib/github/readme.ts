import { findBlockedTerm } from "@/lib/moderation/moderation";

/** Tope de README guardado (C-05): más allá, se trunca — nadie lee 200k en una página. */
export const README_MAX_LENGTH = 200_000;

/**
 * README de un repo vía REST (`GET /repos/{owner}/{repo}/readme`): resuelve el
 * nombre real del archivo (README.md, readme.markdown…), cosa que GraphQL no
 * puede hacer sin adivinar. Devuelve null si el repo no tiene README, si no es
 * decodificable o si el filtro de contenido (S-01) lo rechaza — en ese caso la
 * página de detalle muestra su aviso y en paz: el repo ya pasó moderación por
 * nombre/descripción/topics al importarse.
 */
export async function fetchRepoReadme(
  token: string | null,
  fullName: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetchImpl(`https://api.github.com/repos/${fullName}/readme`, { headers });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`GitHub devolvió ${response.status} al pedir el README de ${fullName}`);
  }

  const body = (await response.json()) as { content?: string; encoding?: string };
  if (typeof body.content !== "string" || body.encoding !== "base64") return null;

  let text: string;
  try {
    text = Buffer.from(body.content, "base64").toString("utf8");
  } catch {
    return null;
  }

  const trimmed = text.trim();
  if (!trimmed) return null;
  if (findBlockedTerm(trimmed) !== null) return null;
  return trimmed.slice(0, README_MAX_LENGTH);
}
