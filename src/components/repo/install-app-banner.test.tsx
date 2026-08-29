// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { InstallAppBanner } from "./install-app-banner";

/**
 * El banner es un componente de servidor sin hooks ni estado: se renderiza
 * directamente. Cubre C-08 sin necesitar sesión de Clerk, que es lo que
 * impedía verificarlo por e2e.
 */
describe("InstallAppBanner (C-08)", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_GITHUB_APP_SLUG = "snapstack-sh";
  });
  afterEach(cleanup);

  it("sin instalar: invita a conectar y explica las dos opciones de alcance", () => {
    render(<InstallAppBanner />);
    expect(screen.getByTestId("install-app-banner")).toBeTruthy();
    expect(screen.getByTestId("install-app-link").getAttribute("href")).toBe(
      "https://github.com/apps/snapstack-sh/installations/new",
    );
    const texto = screen.getByTestId("install-app-banner").textContent ?? "";
    expect(texto).toContain("All repositories");
    expect(texto).toContain("Only select repositories");
    expect(texto).toContain("only ever reads");
  });

  it("instalada: línea discreta que recuerda incluir los repos nuevos", () => {
    render(<InstallAppBanner installed />);
    expect(screen.queryByTestId("install-app-banner")).toBeNull();
    const linea = screen.getByTestId("install-app-connected");
    expect(linea.textContent).toContain("connected");
    expect(linea.textContent).toContain("added later");
    expect(screen.getByTestId("install-app-manage-link").getAttribute("href")).toBe(
      "https://github.com/settings/installations",
    );
  });

  it("sin slug configurado no pinta nada (dev sin App)", () => {
    delete process.env.NEXT_PUBLIC_GITHUB_APP_SLUG;
    const { container } = render(<InstallAppBanner />);
    expect(container.innerHTML).toBe("");
    const instalado = render(<InstallAppBanner installed />);
    expect(instalado.container.innerHTML).toBe("");
  });
});
