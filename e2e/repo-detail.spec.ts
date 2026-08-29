import { test, expect, request as playwrightRequest } from "@playwright/test";

/**
 * C-05: página de detalle del repo. Pública: verificable de punta a punta.
 * Requiere la base local sembrada (pnpm seed:trending).
 */

async function unaSemilla() {
  const api = await playwrightRequest.newContext({ baseURL: "http://localhost:3000" });
  const feed = (await (await api.get("/api/feed?limit=50")).json()) as {
    repos: Array<{ full_name: string; is_seed: boolean; stars: number }>;
  };
  const seed = feed.repos.find((r) => r.is_seed);
  expect(seed).toBeTruthy();
  return seed as { full_name: string; stars: number };
}

test("el detalle de un repo muestra identidad, stats y enlace a GitHub", async ({ page }) => {
  const seed = await unaSemilla();
  await page.goto(`/r/${seed.full_name}`);
  await expect(page.getByTestId("repo-detail-card")).toBeVisible();
  await expect(page.getByTestId("repo-detail-stars")).toContainText(String(seed.stars));
  await expect(page.getByTestId("repo-detail-github-link")).toHaveAttribute(
    "href",
    `https://github.com/${seed.full_name}`,
  );
});

test("el README se renderiza como markdown seguro: sin HTML crudo y con enlaces reescritos al repo", async ({ page }) => {
  // Siembra por la vía de servicio: contenido controlado, con los dos casos
  // hostiles (HTML embebido y enlace relativo).
  process.loadEnvFile(".env.local");
  const { createClient } = await import("@supabase/supabase-js");
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  );
  const seed = await unaSemilla();
  const readme = [
    "# Titulo E2E",
    "",
    '<script>document.title = "xss"</script>',
    "",
    "Un [enlace relativo](docs/guia.md) y texto normal.",
  ].join("\n");
  const { error } = await db
    .from("repos")
    .update({ readme_md: readme, readme_fetched_at: new Date().toISOString() })
    .eq("full_name", seed.full_name);
  expect(error).toBeNull();

  await page.goto(`/r/${seed.full_name}`);
  const zona = page.getByTestId("repo-readme");
  await expect(zona.getByRole("heading", { name: "Titulo E2E" })).toBeVisible();
  // El HTML crudo ni se ejecuta ni aparece como texto.
  await expect(page).not.toHaveTitle("xss");
  await expect(zona).not.toContainText("<script>");
  // El enlace relativo apunta al blob del repo en GitHub.
  await expect(zona.getByRole("link", { name: "enlace relativo" })).toHaveAttribute(
    "href",
    `https://github.com/${seed.full_name}/blob/HEAD/docs/guia.md`,
  );
});

test("el título de una tarjeta del feed navega al detalle", async ({ page }) => {
  await page.goto("/");
  const enlace = page.getByTestId("feed-card-detail-link").first();
  await expect(enlace).toBeVisible();
  await enlace.click();
  await page.waitForURL("**/r/**");
  await expect(page.getByTestId("repo-detail-card")).toBeVisible();
});

test("sin sesión no hay botón de suscripción", async ({ page }) => {
  const seed = await unaSemilla();
  await page.goto(`/r/${seed.full_name}`);
  await expect(page.getByTestId("repo-detail-card")).toBeVisible();
  await expect(page.getByTestId("subscribe-button")).toHaveCount(0);
});

test("un repo inexistente muestra la 404", async ({ page }) => {
  // Con loading.tsx la respuesta llega en streaming (status 200 + notFound
  // dentro del stream): se comprueba la página 404 renderizada, no el status.
  await page.goto("/r/nadie/este-repo-no-existe");
  await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
  await expect(page.getByTestId("repo-detail-card")).toHaveCount(0);
});
