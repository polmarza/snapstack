import { DonateButton } from "./donate-button";

/**
 * Footer discreto, global: autoría, un par de enlaces y la invitación a apoyar
 * el proyecto. Nada que compita con el contenido — texto apagado, borde
 * superior fino; el botón de donación es lo único con color, y está al final
 * a propósito.
 */
export function SiteFooter() {
  return (
    <footer
      data-testid="site-footer"
      className="mt-16 border-t border-edge px-4 py-8 text-center font-mono text-sm text-content-secondary"
    >
      <p>
        Made with <span aria-hidden>❤️</span>
        <span className="sr-only">love</span> by Pol Marzà in Barcelona
      </p>
      <p className="mt-2 flex items-center justify-center gap-4">
        <a
          href="https://github.com/polmarza"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-content"
        >
          GitHub
        </a>
        <span aria-hidden>·</span>
        <a
          href="https://www.linkedin.com/in/polmarza/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-content"
        >
          LinkedIn
        </a>
      </p>
      <div className="mt-6 flex flex-col items-center gap-2">
        <p>Support this project</p>
        <DonateButton />
      </div>
    </footer>
  );
}
