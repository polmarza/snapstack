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
