import { test, expect } from "@playwright/test";

/**
 * M-09: el click hacia el repo registra la señal sin molestar al usuario. La
 * fila resultante en la base local se comprueba con psql en la evidencia del PR.
 *
 * (La señal `expand` dejó de emitirse al quitar el desplegable de la tarjeta;
 * el tipo sigue en el esquema para cuando haya un gesto equivalente.)
 */
test("ir al repo desde el detalle dispara la señal y el enlace sigue funcionando", async ({ page, context }) => {
  // "View on GitHub" vive solo en la vista detalle: la tarjeta navega a /r/.
  await page.goto("/");
  const tarjeta = page.getByTestId("feed-card-detail-link").first();
  await expect(tarjeta).toBeVisible();
  await tarjeta.click();
  await page.waitForURL("**/r/**");

  const enlace = page.getByTestId("repo-detail-github-link");
  await expect(enlace).toHaveAttribute("href", /^https:\/\/github\.com\//);

  const [request] = await Promise.all([
    page.waitForRequest((req) => req.url().includes("/api/signals") && req.method() === "POST"),
    context.waitForEvent("page").catch(() => null), // el enlace abre pestaña nueva
    enlace.click(),
  ]);

  const payload = request.postDataJSON() as Array<{ type: string }>;
  expect(payload.some((event) => event.type === "click_repo")).toBe(true);

  const response = await (await request.response())?.status();
  expect(response).toBe(202);
});
