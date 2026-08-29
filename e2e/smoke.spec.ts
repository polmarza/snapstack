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

test("la landing cuenta el problema, las funcionalidades y cómo empezar, en ese orden", async ({ page }) => {
  await page.goto("/");

  const why = page.getByTestId("landing-why");
  const features = page.getByTestId("landing-features");
  await expect(why).toBeVisible();
  await expect(features).toBeVisible();
  await expect(page.getByRole("heading", { name: "Getting started" })).toBeVisible();

  // Seis funcionalidades, cada una con su título y su texto.
  await expect(features.getByTestId("landing-feature-card")).toHaveCount(6);

  // El orden importa: primero por qué, luego qué, luego cómo, y el stack al final.
  const posicion = async (testId: string) =>
    (await page.getByTestId(testId).boundingBox())?.y ?? 0;
  expect(await posicion("landing-why")).toBeLessThan(await posicion("landing-features"));
  expect(await posicion("landing-features")).toBeLessThan(await posicion("landing-stack"));
});

test("la landing enseña el stack con sus logos y enlaza al código", async ({ page }) => {
  await page.goto("/");
  const stack = page.getByTestId("landing-stack");
  await expect(stack).toBeVisible();

  // Diez tecnologías, cada una con su nombre y su papel.
  await expect(stack.getByTestId("landing-stack-item")).toHaveCount(10);
  await expect(stack).toContainText("Next.js");
  await expect(stack).toContainText("Clerk");
  await expect(stack).toContainText("Supabase");

  // Y la promesa que sostiene la sección: el código es público.
  await expect(stack.getByTestId("landing-stack-repo")).toHaveAttribute(
    "href",
    "https://github.com/polmarza/snapstack",
  );
});

test("la landing lleva navegación: centrada en el hero y fija tras pasarlo", async ({ page }) => {
  await page.goto("/");

  // En el hero: los enlaces, sin barra fija a la vista.
  await expect(page.getByTestId("landing-nav-hero")).toBeVisible();
  await expect(page.getByTestId("landing-nav-sticky")).toHaveAttribute("data-visible", "false");

  // Pasado el hero, la barra fija entra con su marca y su botón de entrar.
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.2));
  const fija = page.getByTestId("landing-nav-sticky");
  await expect(fija).toHaveAttribute("data-visible", "true");
  await expect(fija.getByTestId("sign-in-button")).toBeVisible();

  // Y los enlaces llevan a su sección, sin que la barra tape el titular.
  await fija.getByTestId("landing-nav-stack").click();
  await expect(page.getByRole("heading", { name: "How it's built" })).toBeInViewport();
  const tapado = await page.evaluate(() => {
    const h = document.querySelector("#stack h2")!.getBoundingClientRect();
    const nav = document.querySelector('[data-testid="landing-nav-sticky"]')!.getBoundingClientRect();
    return h.top < nav.bottom;
  });
  expect(tapado).toBe(false);
});
