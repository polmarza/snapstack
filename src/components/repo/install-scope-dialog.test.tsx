// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeAll } from "vitest";
import { render, screen, cleanup, fireEvent, within } from "@testing-library/react";
import { InstallScopeDialog } from "./install-scope-dialog";

/**
 * El modal de alcances (C-08). jsdom no implementa showModal/close del
 * <dialog>: se definen mínimamente (abrir = atributo `open`) para poder
 * comprobar el comportamiento del botón y leer el contenido, que estando
 * cerrado queda fuera del árbol de accesibilidad, como en un navegador.
 */
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute("open");
  };
});

describe("InstallScopeDialog (C-08)", () => {
  afterEach(cleanup);

  it("el modal nace cerrado; el botón lo abre y la cruz lo cierra", () => {
    render(<InstallScopeDialog />);
    const dialogo = screen.getByTestId("install-scope-dialog");
    expect(dialogo.hasAttribute("open")).toBe(false);

    fireEvent.click(screen.getByTestId("install-scope-open"));
    expect(dialogo.hasAttribute("open")).toBe(true);

    fireEvent.click(screen.getByTestId("install-scope-close"));
    expect(dialogo.hasAttribute("open")).toBe(false);
  });

  it("un click en el fondo cierra; dentro del contenido, no", () => {
    render(<InstallScopeDialog />);
    const dialogo = screen.getByTestId("install-scope-dialog");
    fireEvent.click(screen.getByTestId("install-scope-open"));

    fireEvent.click(within(dialogo).getByText("All repositories"));
    expect(dialogo.hasAttribute("open")).toBe(true); // el contenido no cierra

    fireEvent.click(dialogo); // el propio <dialog> es el fondo
    expect(dialogo.hasAttribute("open")).toBe(false);
  });

  it("explica las dos opciones, marca la recomendada y da una ilustración a cada una", () => {
    render(<InstallScopeDialog />);
    fireEvent.click(screen.getByTestId("install-scope-open"));
    const dialogo = screen.getByTestId("install-scope-dialog");
    const texto = dialogo.textContent ?? "";

    expect(texto).toContain("All repositories");
    expect(texto).toContain("Only select repositories");
    expect(texto).toContain("Recommended");
    // Lo que decide entre una y otra.
    expect(texto).toContain("automatically");
    expect(texto).toContain("come back");
    // La contrapartida de recomendar "todos": solo lectura.
    expect(texto).toContain("only ever reads");

    const dibujos = within(dialogo).getAllByRole("img");
    expect(dibujos).toHaveLength(2);
    expect(dibujos[0].getAttribute("aria-label")).toContain("All repositories");
    expect(dibujos[1].getAttribute("aria-label")).toContain("Only select repositories");
  });
});
