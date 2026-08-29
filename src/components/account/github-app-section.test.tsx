// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { GithubAppSection } from "./github-app-section";

/** La casa permanente de la conexión (C-08): Settings, conectado o no. */
describe("GithubAppSection (C-08)", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_GITHUB_APP_SLUG = "snapstack-sh";
  });
  afterEach(cleanup);

  it("sin conectar: lo dice y ofrece conectar", () => {
    render(<GithubAppSection installed={false} />);
    const estado = screen.getByTestId("github-app-status");
    expect(estado.getAttribute("data-installed")).toBe("false");
    expect(estado.textContent).toContain("Not connected");
    expect(screen.getByTestId("github-app-connect").getAttribute("href")).toBe(
      "https://github.com/apps/snapstack-sh/installations/new",
    );
    expect(screen.queryByTestId("github-app-manage")).toBeNull();
  });

  it("conectado: lo confirma y lleva a gestionar los repos cubiertos", () => {
    render(<GithubAppSection installed />);
    const estado = screen.getByTestId("github-app-status");
    expect(estado.getAttribute("data-installed")).toBe("true");
    expect(estado.textContent).toContain("Connected");
    expect(estado.textContent).toContain("add later");
    expect(screen.getByTestId("github-app-manage").getAttribute("href")).toBe(
      "https://github.com/settings/installations",
    );
    expect(screen.queryByTestId("github-app-connect")).toBeNull();
  });

  it("la explicación de alcances sigue a mano en los dos estados", () => {
    render(<GithubAppSection installed={false} />);
    expect(screen.getByTestId("install-scope-open")).toBeTruthy();
    cleanup();
    render(<GithubAppSection installed />);
    expect(screen.getByTestId("install-scope-open")).toBeTruthy();
  });

  it("sin slug configurado no pinta nada", () => {
    delete process.env.NEXT_PUBLIC_GITHUB_APP_SLUG;
    const { container } = render(<GithubAppSection installed />);
    expect(container.innerHTML).toBe("");
  });
});
