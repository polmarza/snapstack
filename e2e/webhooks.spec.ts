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

/** Un repo semilla cualquiera del feed, para no tocar los de Pol. */
async function repoSemilla(page: import("@playwright/test").Page) {
  const api = await playwrightRequest.newContext({ baseURL: "http://localhost:3000" });
  const feed = await (await api.get("/api/feed")).json();
  const seed = feed.repos.find((r: { is_seed: boolean }) => r.is_seed);
  expect(seed).toBeTruthy();
  void page;
  return seed as { github_repo_id: number; full_name: string; url: string; stars: number };
}

test("una firma inválida devuelve 401 y no toca nada", async () => {
  const res = await enviar("push", { repository: { id: 1 } }, "sha256=mala");
  expect(res.status()).toBe(401);
});

test("un evento star firmado cambia las stars que muestra el feed", async ({ page }) => {
  const repo = await repoSemilla(page);
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

  await page.goto("/");
  await expect(page.locator(`[data-repo-id="${repo.github_repo_id}"]`)).toContainText(String(nuevasStars));
});

test("repository.privatized hace desaparecer la ficha del feed (sin fantasmas), y publicized la devuelve", async ({ page }) => {
  const repo = await repoSemilla(page);
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

  expect((await enviar("repository", { action: "privatized", ...payload })).status()).toBe(200);
  await page.goto("/");
  await expect(page.locator(`[data-repo-id="${repo.github_repo_id}"]`)).toHaveCount(0);

  // Restaurar: publicized reactiva.
  expect((await enviar("repository", { action: "publicized", ...payload })).status()).toBe(200);
  await page.goto("/");
  await expect(page.locator(`[data-repo-id="${repo.github_repo_id}"]`)).toHaveCount(1);
});
