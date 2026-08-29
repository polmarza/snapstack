/**
 * Footer discreto, global: autoría y un par de enlaces. Nada que compita con el
 * contenido — una línea, texto apagado, borde superior fino.
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
    </footer>
  );
}
