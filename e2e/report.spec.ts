import { test, expect } from "@playwright/test";

/**
 * S-01: reportar exige sesión — sin ella no hay ni menú en la tarjeta. El
 * reporte real con sesión lo valida Pol manualmente (fila comprobada por psql).
 */
test("sin sesión, la tarjeta no ofrece el menú de reporte", async ({ page }) => {
  await page.goto("/");
  const primera = page.getByTestId("feed-card").first();
  await expect(primera).toBeVisible();
  await expect(primera.getByTestId("card-menu-button")).toHaveCount(0);
});
