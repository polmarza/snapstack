import { test, expect } from "@playwright/test";

/**
 * M-06: feed de scroll infinito en la home. Requiere Supabase local levantado y
 * más de una página de contenido (pnpm seed:trending importa ~30 repos).
 */

test("la home muestra la primera página del feed", async ({ page }) => {
  await page.goto("/");
  const cards = page.getByTestId("feed-card");
  await expect(cards.first()).toBeVisible();
  expect(await cards.count()).toBeGreaterThan(0);
  expect(await cards.count()).toBeLessThanOrEqual(10);
});

test("el scroll carga más páginas sin recargar y el fin del feed es explícito", async ({ page }) => {
  await page.goto("/");
  const cards = page.getByTestId("feed-card");
  await expect(cards.first()).toBeVisible();
  const primeraPagina = await cards.count();

  // Scroll hasta agotar el contenido (con tope de vueltas por si algo se rompe).
  for (let i = 0; i < 10; i++) {
    await page.mouse.wheel(0, 100000);
    await page.waitForTimeout(500);
    if (await page.getByTestId("feed-end").isVisible().catch(() => false)) break;
  }

  expect(await cards.count()).toBeGreaterThan(primeraPagina);
  await expect(page.getByTestId("feed-end")).toBeVisible();

  // Sin duplicados: cada tarjeta corresponde a un repo distinto (dos repos de
  // autores distintos pueden compartir nombre corto; la identidad es el id).
  const ids = await page
    .getByTestId("feed-card")
    .evaluateAll((cards) => cards.map((card) => card.getAttribute("data-repo-id")));
  expect(new Set(ids).size).toBe(ids.length);
});

test("la tarjeta muestra autor y enlace al repo, sin desplegables", async ({ page }) => {
  await page.goto("/");
  const primera = page.getByTestId("feed-card").first();
  await expect(primera).toBeVisible();

  await expect(primera.getByTestId("feed-card-owner")).toBeVisible();
  await expect(primera.getByTestId("feed-card-stars")).toBeVisible();

  const href = await primera.getByTestId("feed-card-repo-link").getAttribute("href");
  expect(href).toMatch(/^https:\/\/github\.com\//);

  // Ya no hay nada plegado: todo lo visible está a la vista.
  await expect(primera.getByTestId("feed-card-expand")).toHaveCount(0);
});
