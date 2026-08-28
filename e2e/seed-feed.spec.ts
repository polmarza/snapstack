import { test, expect } from "@playwright/test";

/**
 * M-10: /dev/seed muestra fichas de los repos importados por pnpm seed:trending.
 * Requiere Supabase local levantado (supabase start) y el seed ejecutado.
 */
test("los repos semilla importados se muestran como fichas", async ({ page }) => {
  await page.goto("/dev/seed");
  const cards = page.getByTestId("seed-card");
  await expect(cards.first()).toBeVisible();
  expect(await cards.count()).toBeGreaterThan(0);
});
