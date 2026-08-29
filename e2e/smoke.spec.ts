import { test, expect } from "@playwright/test";

test("la home carga y muestra el nombre del producto", async ({ page }) => {
  await page.goto("/");
  // level 1 + exact: el feed puede contener un repo llamado literalmente "snapstack".
  await expect(page.getByRole("heading", { level: 1, name: "Snapstack", exact: true })).toBeVisible();
});

test("la demo de fichas renderiza las tarjetas", async ({ page }) => {
  await page.goto("/dev/cards");
  await expect(page.getByTestId("repo-card").first()).toBeVisible();
});
