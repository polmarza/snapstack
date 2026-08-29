import { test, expect } from "@playwright/test";

test("la home carga y muestra el nombre del producto", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("header-wordmark")).toHaveText("snapstack");
});

test("la demo de fichas renderiza las tarjetas", async ({ page }) => {
  await page.goto("/dev/cards");
  await expect(page.getByTestId("repo-card").first()).toBeVisible();
});
