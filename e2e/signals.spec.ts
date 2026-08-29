import { test, expect } from "@playwright/test";

/**
 * M-09: expandir una ficha registra la señal sin molestar al usuario.
 * La fila resultante en la base local se comprueba con psql en la evidencia del PR.
 */
test("expandir una tarjeta dispara la señal y la navegación sigue intacta", async ({ page }) => {
  await page.goto("/");
  const primera = page.getByTestId("feed-card").first();
  await expect(primera).toBeVisible();

  const [request] = await Promise.all([
    page.waitForRequest((req) => req.url().includes("/api/signals") && req.method() === "POST"),
    primera.getByTestId("feed-card-expand").click(),
  ]);

  const payload = request.postDataJSON() as Array<{ type: string }>;
  expect(payload.some((event) => event.type === "expand")).toBe(true);

  const response = await (await request.response())?.status();
  expect(response).toBe(202);

  // La UI no se ha visto afectada.
  await expect(primera.getByTestId("feed-card-details")).toBeVisible();
});
