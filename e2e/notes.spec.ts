import { test, expect } from "@playwright/test";

/**
 * Notas ancladas a un repo (C-09) y el feed mixto (C-11).
 *
 * **Qué NO cubre este archivo, y por qué.** Publicar una nota exige sesión de
 * Clerk y repos propios, y el proyecto no testea contra Clerk (`docs/testing.md`).
 * Así que aquí se valida todo lo que se puede sin sesión: la forma del feed y su
 * paginación, y la tarjeta y el compositor contra `/dev/notes`, que los monta con
 * datos de mentira. El camino completo —escribir, publicar, verla en el feed, en
 * el perfil y en el detalle— se comprueba a mano con sesión y queda en el PR.
 */

test("C-11: el feed sirve ítems con tipo, y pagina sin repetir", async ({ request }) => {
  const vistos = new Set<string>();
  let cursor: string | null = null;
  let paginas = 0;

  do {
    const url = cursor ? `/api/feed?cursor=${encodeURIComponent(cursor)}` : "/api/feed";
    const res = await request.get(url);
    expect(res.status()).toBe(200);
    const page = (await res.json()) as {
      items: Array<{ kind: string; id: string; at: string }>;
      nextCursor: string | null;
    };

    for (const item of page.items) {
      // La unidad del feed ya no es el repo: cada ítem dice qué es y cuándo fue.
      expect(["repo", "note"]).toContain(item.kind);
      expect(item.at).toBeTruthy();
      expect(vistos.has(item.id)).toBe(false);
      vistos.add(item.id);
    }

    // El orden es por recencia descendente dentro de la página.
    const instantes = page.items.map((i) => i.at);
    expect([...instantes].sort().reverse()).toEqual(instantes);

    cursor = page.nextCursor;
    paginas++;
  } while (cursor && paginas < 10);

  expect(cursor).toBeNull(); // el final del feed sigue siendo explícito
});

test("C-11: un cursor del formato barajado anterior no rompe el feed, vuelve al principio", async ({
  request,
}) => {
  const viejo = Buffer.from(
    JSON.stringify({ s: "80000000", t: "2fa9c01d", id: "123e4567-e89b-42d3-a456-426614174000", w: 0 }),
  ).toString("base64url");
  const res = await request.get(`/api/feed?cursor=${encodeURIComponent(viejo)}`);
  expect(res.status()).toBe(200);
  const page = (await res.json()) as { items: unknown[] };
  expect(Array.isArray(page.items)).toBe(true);
});

test("C-09: la tarjeta de nota enseña autor, cuerpo y el repo del que cuelga", async ({ page }) => {
  await page.goto("/dev/notes");

  const primera = page.getByTestId("note-card").first();
  await expect(primera).toBeVisible();
  await expect(primera.getByTestId("note-author")).toBeVisible();
  await expect(primera.getByTestId("note-body")).toContainText("note composer");

  // El ancla siempre visible: es la regla del producto hecha interfaz.
  const ancla = primera.getByTestId("note-repo");
  await expect(ancla).toBeVisible();
  await expect(ancla).toHaveAttribute("href", "/r/polmarza/snapstack");
});

test("C-09: en el perfil y el detalle la nota no repite el repo, que ya está en la cabecera", async ({
  page,
}) => {
  await page.goto("/dev/notes");
  // La última de la demo se pinta con showRepo={false}.
  const ultima = page.getByTestId("note-card").last();
  await expect(ultima.getByTestId("note-body")).toBeVisible();
  await expect(ultima.getByTestId("note-repo")).toHaveCount(0);
});

test("C-09: sin repo elegido no se puede ni escribir — no hay ninguno por defecto", async ({
  page,
}) => {
  await page.goto("/dev/notes");

  // Empieza plegado: el feed es para mirar, no un formulario con feed debajo.
  await expect(page.getByTestId("note-composer")).toHaveCount(0);
  await page.getByTestId("note-composer-open").click();

  const compositor = page.getByTestId("note-composer");
  await expect(compositor).toBeVisible();

  // El selector va antes del texto en el orden del DOM, y arranca sin elegir.
  const selector = compositor.getByTestId("note-composer-repo");
  const texto = compositor.getByTestId("note-composer-body");
  const orden = await compositor.evaluate((root) =>
    Array.from(root.querySelectorAll("[data-testid]")).map((n) => n.getAttribute("data-testid")),
  );
  expect(orden.indexOf("note-composer-repo")).toBeLessThan(orden.indexOf("note-composer-body"));
  await expect(selector).toHaveValue("");

  // Lo que evita el error caro: sin ancla no se escribe, así que no se puede
  // publicar sobre el repo equivocado y tener que borrar y reescribir.
  await expect(texto).toBeDisabled();
  await expect(compositor.getByTestId("note-composer-submit")).toBeDisabled();

  // Elegido el repo, el texto se abre y recibe el foco.
  await selector.selectOption({ index: 1 });
  await expect(texto).toBeEnabled();
  await expect(texto).toBeFocused();
  await expect(compositor.getByTestId("note-composer-submit")).toBeDisabled();

  // Y de vacío sigue sin publicarse.
  await texto.fill("   ");
  await expect(compositor.getByTestId("note-composer-submit")).toBeDisabled();

  await texto.fill("arreglado el bug del cursor");
  await expect(compositor.getByTestId("note-composer-submit")).toBeEnabled();
  await expect(compositor.getByTestId("note-composer-count")).toHaveText("473");
});

test("C-09: el compositor de la demo no publica — sus repos no existen", async ({ page }) => {
  await page.goto("/dev/notes");
  await page.getByTestId("note-composer-open").click();

  const compositor = page.getByTestId("note-composer");
  await compositor.getByTestId("note-composer-repo").selectOption({ index: 1 });
  await compositor.getByTestId("note-composer-body").fill("esto no debería llegar al servidor");
  await compositor.getByTestId("note-composer-submit").click();

  // Sin este corte, la demo llamaba a la acción real con un repo inventado y
  // el servidor respondía "no es tuyo": correcto, pero parece un fallo.
  await expect(compositor.getByTestId("note-composer-error")).toContainText("nothing is published");
});

test("C-11: la selección de repos sale del menú principal y se llega desde Settings", async ({
  page,
}) => {
  // Sin sesión no hay barra lateral que mirar, pero la ruta sigue existiendo y
  // protegida: quien no ha entrado va a la home.
  await page.goto("/settings/repos");
  await page.waitForURL("**/");
  await expect(page.getByTestId("sign-in-button").first()).toBeVisible();
});
