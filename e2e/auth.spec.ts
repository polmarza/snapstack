import { test, expect } from "@playwright/test";

/**
 * M-01: sin sesión, la cabecera ofrece entrar con GitHub y el feed sigue siendo
 * público. El flujo OAuth completo contra GitHub real no se automatiza (servicio
 * externo, ver docs/testing.md): se valida manualmente y queda anotado en el PR.
 */
test("sin sesión aparece el botón de entrar y el feed sigue navegable", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("sign-in-button")).toBeVisible();
  await expect(page.getByTestId("feed-card").first()).toBeVisible();
});
