import { test, expect } from "@playwright/test";

/**
 * M-06: feed de scroll infinito en la home. Requiere Supabase local levantado y
 * más de una página de contenido (pnpm seed:trending importa ~30 repos).
 */

test("la landing muestra la muestra del feed: 3 fichas y una cuarta desvanecida", async ({ page }) => {
  await page.goto("/");
  const preview = page.getByTestId("landing-feed-preview");
  await expect(preview).toBeVisible();
  const cards = preview.getByTestId("feed-card");
  await expect(cards.first()).toBeVisible();
  expect(await cards.count()).toBe(4); // 3 completas + la del degradado
});

test("la paginación del feed encadena páginas sin duplicar ni saltar fichas", async ({ request }) => {
  // La UI de scroll infinito es ahora de usuarios con sesión (la landing enseña
  // una muestra); la garantía de M-06 —cursor keyset estable— se verifica aquí
  // contra la API real.
  const vistos = new Set<string>();
  let cursor: string | null = null;
  let paginas = 0;

  do {
    const url = cursor ? `/api/feed?cursor=${encodeURIComponent(cursor)}` : "/api/feed";
    const res = await request.get(url);
    expect(res.status()).toBe(200);
    const page = (await res.json()) as { repos: Array<{ id: string }>; nextCursor: string | null };
    for (const repo of page.repos) {
      expect(vistos.has(repo.id)).toBe(false); // sin duplicados entre páginas
      vistos.add(repo.id);
    }
    cursor = page.nextCursor;
    paginas++;
  } while (cursor && paginas < 10);

  expect(paginas).toBeGreaterThan(1); // hay más de una página real
  expect(cursor).toBeNull(); // y el final es explícito
});

test("la tarjeta muestra autor, stats dentro del degradado y navega al detalle", async ({ page }) => {
  await page.goto("/");
  const primera = page.getByTestId("feed-card").first();
  await expect(primera).toBeVisible();

  await expect(primera.getByTestId("feed-card-owner")).toBeVisible();
  await expect(primera.getByTestId("feed-card-stars")).toBeVisible();
  // Clicks dentro del degradado; el pie queda para el autor.
  await expect(primera.getByTestId("feed-card-clicks")).toBeVisible();

  // El título enlaza al detalle; "View on GitHub" ya solo existe allí.
  const href = await primera.getByTestId("feed-card-detail-link").getAttribute("href");
  expect(href).toMatch(/^\/r\//);
  await expect(primera.getByTestId("feed-card-repo-link")).toHaveCount(0);

  // Ya no hay nada plegado: todo lo visible está a la vista.
  await expect(primera.getByTestId("feed-card-expand")).toHaveCount(0);
});
