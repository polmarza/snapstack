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
  // El scroll se ancla a una sección (y no a un número de píxeles): en dev la
  // página aún está creciendo cuando `goto` vuelve.
  await page.getByTestId("landing-features").scrollIntoViewIfNeeded();
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

test("en móvil el menú se despliega como un panel lateral, con la barra en su sitio", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await page.getByTestId("landing-features").scrollIntoViewIfNeeded();

  const fija = page.getByTestId("landing-nav-sticky");
  await expect(fija).toHaveAttribute("data-visible", "true");

  // Cerrado: el icono invita a abrir y la entrada ya está arriba a la derecha.
  const toggle = fija.getByTestId("landing-nav-burger");
  await expect(toggle).toHaveAttribute("aria-label", "Open menu");
  await expect(fija.getByTestId("sign-in-button")).toBeVisible();
  await expect(page.getByTestId("landing-nav-overlay")).toHaveCount(0);

  await toggle.click();

  // Abierto: el icono pasa a contraer y la barra no se ha movido de sitio.
  const overlay = page.getByTestId("landing-nav-overlay");
  await expect(overlay).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-label", "Close menu");
  await expect(fija.getByTestId("sign-in-button")).toBeVisible();

  // Las flechas caen bajo el icono: misma rejilla, alineada a la izquierda.
  const alineados = await page.evaluate(() => {
    const centro = (el: Element) => {
      const r = el.getBoundingClientRect();
      return Math.round(r.left + r.width / 2);
    };
    const icono = document.querySelector('[data-testid="landing-nav-burger"] svg')!;
    const flecha = document.querySelector('[data-testid="landing-nav-overlay"] svg')!;
    return Math.abs(centro(icono) - centro(flecha)) <= 1;
  });
  expect(alineados).toBe(true);

  for (const id of ["why", "features", "start", "stack", "faq"]) {
    await expect(overlay.getByTestId(`landing-nav-mobile-${id}`)).toBeVisible();
  }

  // Pulsar una sección navega y cierra el panel.
  await overlay.getByTestId("landing-nav-mobile-faq").click();
  await expect(overlay).toHaveCount(0);
  await expect(page.getByTestId("landing-faq")).toBeInViewport();
});

test("el footer ofrece las dos vías de apoyo al proyecto", async ({ page }) => {
  await page.goto("/");
  const footer = page.getByTestId("site-footer");
  await expect(footer).toContainText("Support this project");
  // Sponsors para quien ya tiene cuenta de GitHub; el café, para el resto.
  await expect(footer.getByTestId("sponsor-button")).toHaveAttribute(
    "href",
    "https://github.com/sponsors/polmarza",
  );
  await expect(footer.getByTestId("donate-button")).toHaveAttribute(
    "href",
    "https://www.buymeacoffee.com/polmarza",
  );
});
