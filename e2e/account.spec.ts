import { test, expect } from "@playwright/test";

/**
 * M-11: la página de cuenta exige sesión. El borrado real con cuenta es
 * destructivo y queda como validación manual opcional (ver ficha).
 */
test("sin sesión, /settings/account redirige a la home", async ({ page }) => {
  await page.goto("/settings/account");
  await page.waitForURL("**/");
  await expect(page.getByTestId("sign-in-button")).toBeVisible();
});
