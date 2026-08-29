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

  it("sin instalar: invita a conectar y ofrece la explicación del alcance", () => {
    render(<InstallAppBanner />);
    expect(screen.getByTestId("install-app-banner")).toBeTruthy();
    expect(screen.getByTestId("install-app-link").getAttribute("href")).toBe(
      "https://github.com/apps/snapstack-sh/installations/new",
    );
    // El detalle de los alcances vive en el modal (ver install-scope-dialog).
    expect(screen.getByTestId("install-scope-open")).toBeTruthy();
  });

  it("instalada: el aviso desaparece — su sitio permanente es Settings", () => {
    const { container } = render(<InstallAppBanner installed />);
    expect(container.innerHTML).toBe("");
  });

  it("sin instalar: enlaza también a Settings, donde vive la gestión", () => {
    render(<InstallAppBanner />);
    expect(screen.getByTestId("install-app-settings-link").getAttribute("href")).toBe(
      "/settings/account",
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
