import { DonateButton, SponsorButton } from "./support-links";

/**
 * Footer discreto, global: autoría, un par de enlaces y la invitación a apoyar
 * el proyecto. Nada que compita con el contenido — texto apagado, borde
 * superior fino; el botón de patrocinio es lo único con color, y está al final
 * a propósito.
 *
 * Aquí van las dos vías, y no una: el footer se lee sobre todo en la landing,
 * donde entra gente sin cuenta de GitHub. Sponsors es la principal (con color)
 * porque es la que le sirve a un dev sin registrarse en nada nuevo; el café es
 * la salida para todos los demás.
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
      <div className="mt-6 flex flex-col items-center gap-3">
        <p>Support this project</p>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <SponsorButton label="Sponsor on GitHub" />
          <DonateButton />
        </div>
      </div>
    </footer>
  );
}
