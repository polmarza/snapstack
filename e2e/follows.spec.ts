import { test, expect } from "@playwright/test";

/**
 * M-07 sin sesión: ni pestaña Following ni botones de follow. El flujo con
 * sesión lo valida Pol contra el perfil de prueba (ver ficha), anotado en el PR.
 */

test("sin sesión no hay pestaña Following", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("feed-card").first()).toBeVisible();
  await expect(page.getByTestId("feed-tabs")).toHaveCount(0);
});

test("sin sesión el perfil no ofrece follow", async ({ page }) => {
  await page.goto("/u/polmarza");
  await expect(page.getByTestId("profile-header")).toBeVisible();
  await expect(page.getByTestId("follow-button")).toHaveCount(0);
});

test("sin sesión, /api/feed?filter=following exige sesión", async ({ request }) => {
  const res = await request.get("/api/feed?filter=following");
  expect(res.status()).toBe(401);
});
