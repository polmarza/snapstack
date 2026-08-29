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
  // Contadores de follows: siempre visibles, con el formato "N followers · N following".
  await expect(page.getByTestId("profile-follow-counts")).toHaveText(/^\d+ followers? · \d+ following$/);
});

test("un username inexistente devuelve 404", async ({ page }) => {
  const response = await page.goto("/u/este-usuario-no-existe");
  expect(response?.status()).toBe(404);
});

test("el pie de una tarjeta con dueño navega al perfil; las semillas no enlazan", async ({ page }) => {
  // El orden del feed es aleatorio (ficha feed-orden-aleatorio): la muestra de
  // la landing no garantiza una tarjeta con dueño, así que esa parte se valida
  // donde siempre las hay: el perfil.
  await page.goto("/u/polmarza");
  const ownedLink = page.getByTestId("feed-card-owner-link").first();
  await expect(ownedLink).toBeVisible();
  await ownedLink.click();
  await page.waitForURL("**/u/polmarza");
  await expect(page.getByTestId("profile-header")).toBeVisible();

  // En la muestra de la landing casi todo es semilla del trending, y su pie no
  // es un enlace (una muestra de 4 sin ninguna semilla es despreciable con
  // ~29 semillas de ~34 fichas).
  await page.goto("/");
  const totalCards = await page.getByTestId("feed-card").count();
  const linkedCards = await page.getByTestId("feed-card-owner-link").count();
  expect(linkedCards).toBeLessThan(totalCards);
});

test("el perfil muestra tagline, bio y los iconos de enlaces sociales (C-03)", async ({ page }) => {
  // Siembra por la vía de servicio: el formulario de Settings exige sesión de
  // Clerk (no automatizable aquí); la lectura pública sí se verifica de punta
  // a punta.
  process.loadEnvFile(".env.local");
  const { createClient } = await import("@supabase/supabase-js");
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  );
  const { error } = await db
    .from("profiles")
    .update({
      tagline: "Building snapstack in public.",
      bio: "Curated repos, procedural cards, and a feed of what devs actually build.",
      social_links: {
        x: "https://x.com/polmarza",
        linkedin: "https://www.linkedin.com/in/polmarza/",
      },
    })
    .eq("username", "polmarza");
  expect(error).toBeNull();

  await page.goto("/u/polmarza");
  await expect(page.getByTestId("profile-tagline")).toHaveText("Building snapstack in public.");
  await expect(page.getByTestId("profile-bio")).toContainText("procedural cards");
  await expect(page.getByTestId("profile-social-x")).toHaveAttribute("href", "https://x.com/polmarza");
  await expect(page.getByTestId("profile-social-linkedin")).toHaveAttribute(
    "href",
    "https://www.linkedin.com/in/polmarza/",
  );
});
