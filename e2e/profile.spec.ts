import { test, expect } from "@playwright/test";

/**
 * M-05: perfil público. Automatizable de punta a punta: no requiere sesión.
 * Requiere la base local con el perfil de polmarza y sus repos importados
 * (estado que dejan M-01/M-02 validadas).
 */

test("el perfil público muestra la identidad y las fichas de los repos seleccionados", async ({ page }) => {
  await page.goto("/u/polmarza");
  await expect(page.getByTestId("profile-header")).toBeVisible();
  await expect(page.getByTestId("profile-username")).toHaveText("@polmarza");
  const cards = page.getByTestId("feed-card");
  expect(await cards.count()).toBeGreaterThan(0);
});

test("un username inexistente devuelve 404", async ({ page }) => {
  const response = await page.goto("/u/este-usuario-no-existe");
  expect(response?.status()).toBe(404);
});

test("el pie de una tarjeta con dueño navega al perfil; las semillas no enlazan", async ({ page }) => {
  await page.goto("/");
  const ownedLink = page.getByTestId("feed-card-owner-link").first();
  await expect(ownedLink).toBeVisible();
  await ownedLink.click();
  await page.waitForURL("**/u/**");
  await expect(page.getByTestId("profile-header")).toBeVisible();

  // En el feed hay semillas del trending: su pie no es un enlace.
  await page.goto("/");
  const totalCards = await page.getByTestId("feed-card").count();
  const linkedCards = await page.getByTestId("feed-card-owner-link").count();
  expect(linkedCards).toBeLessThan(totalCards);
});
