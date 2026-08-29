import { test, expect } from "@playwright/test";

test("la home carga y muestra el nombre del producto", async ({ page }) => {
  await page.goto("/");
  // Sin sesión la home es la landing: la marca vive en el héroe, no en la cabecera.
  await expect(page.getByTestId("hero-wordmark")).toHaveText("snapstack");
});

test("la demo de fichas renderiza las tarjetas", async ({ page }) => {
  await page.goto("/dev/cards");
  await expect(page.getByTestId("repo-card").first()).toBeVisible();
});
