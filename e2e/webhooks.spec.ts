import { test, expect, request as playwrightRequest } from "@playwright/test";
import { createHmac } from "node:crypto";

/**
 * M-08 contra el server real y la base local: payloads firmados con el secret
 * de .env.local, igual que los firmaría GitHub.
 */

process.loadEnvFile(".env.local");
const SECRET = process.env.GITHUB_WEBHOOK_SECRET ?? "";

const firmar = (body: string) => `sha256=${createHmac("sha256", SECRET).update(body).digest("hex")}`;

async function enviar(eventName: string, payload: unknown, firma?: string) {
  const api = await playwrightRequest.newContext({ baseURL: "http://localhost:3000" });
  const body = JSON.stringify(payload);
  const res = await api.post("/api/webhooks/github", {
    headers: {
      "Content-Type": "application/json",
      "X-GitHub-Event": eventName,
      "X-Hub-Signature-256": firma ?? firmar(body),
    },
    data: body,
  });
  return res;
}

interface FeedRepoLite {
  github_repo_id: number;
  full_name: string;
  url: string;
  stars: number;
  is_seed: boolean;
}

/**
 * El feed completo, vuelta entera de cursores: con el orden aleatorio (ficha
 * feed-orden-aleatorio) ninguna ficha tiene garantizada la primera página.
 */
async function feedCompleto(): Promise<FeedRepoLite[]> {
  const api = await playwrightRequest.newContext({ baseURL: "http://localhost:3000" });
  const repos: FeedRepoLite[] = [];
  let cursor: string | null = null;
  do {
    const url = cursor ? `/api/feed?cursor=${encodeURIComponent(cursor)}` : "/api/feed";
    const page = (await (await api.get(url)).json()) as {
      repos: FeedRepoLite[];
      nextCursor: string | null;
    };
    repos.push(...page.repos);
    cursor = page.nextCursor;
  } while (cursor);
  return repos;
}

/** Un repo semilla cualquiera del feed, para no tocar los de Pol. */
async function repoSemilla() {
  const seed = (await feedCompleto()).find((r) => r.is_seed);
  expect(seed).toBeTruthy();
  return seed as FeedRepoLite;
}

test("una firma inválida devuelve 401 y no toca nada", async () => {
  const res = await enviar("push", { repository: { id: 1 } }, "sha256=mala");
  expect(res.status()).toBe(401);
});

test("un evento star firmado cambia las stars que sirve el feed", async () => {
  const repo = await repoSemilla();
  const nuevasStars = 54321;

  const res = await enviar("star", {
    repository: {
      id: repo.github_repo_id,
      full_name: repo.full_name,
      description: null,
      html_url: repo.url,
      language: null,
      stargazers_count: nuevasStars,
    },
  });
  expect(res.status()).toBe(200);

  const actualizado = (await feedCompleto()).find((r) => r.github_repo_id === repo.github_repo_id);
  expect(actualizado?.stars).toBe(nuevasStars);
});

test("repository.privatized hace desaparecer la ficha del feed (sin fantasmas), y publicized la devuelve", async () => {
  const repo = await repoSemilla();
  const payload = {
    repository: {
      id: repo.github_repo_id,
      full_name: repo.full_name,
      description: null,
      html_url: repo.url,
      language: null,
      stargazers_count: repo.stars,
    },
  };

  const enFeed = async () =>
    (await feedCompleto()).some((r) => r.github_repo_id === repo.github_repo_id);

  expect((await enviar("repository", { action: "privatized", ...payload })).status()).toBe(200);
  expect(await enFeed()).toBe(false); // sin fantasmas

  // Restaurar: publicized reactiva.
  expect((await enviar("repository", { action: "publicized", ...payload })).status()).toBe(200);
  expect(await enFeed()).toBe(true);
});
