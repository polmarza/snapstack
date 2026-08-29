import { test, expect } from "@playwright/test";

/**
 * S-01: reportar exige sesión — un visitante anónimo no ve el control. El
 * reporte real con sesión lo valida Pol manualmente (fila comprobada por psql).
 */
test("sin sesión, la ficha expandida no ofrece reportar", async ({ page }) => {
  await page.goto("/");
  const primera = page.getByTestId("feed-card").first();
  await primera.getByTestId("feed-card-expand").click();
  await expect(primera.getByTestId("feed-card-details")).toBeVisible();
  await expect(primera.getByTestId("report-button")).toHaveCount(0);
});
