import { test, expect } from "@playwright/test";

/**
 * M-02/M-03: sin sesión, las rutas de selección redirigen a la home (donde vive
 * el login). El flujo autenticado completo (listar, importar, quitar) se valida
 * manualmente — ver la ficha y el PR.
 */
for (const ruta of ["/onboarding", "/settings/repos"]) {
  test(`sin sesión, ${ruta} redirige a la home con el login a la vista`, async ({ page }) => {
    await page.goto(ruta);
    await page.waitForURL("**/");
    await expect(page.getByTestId("sign-in-button").first()).toBeVisible();
  });
}
