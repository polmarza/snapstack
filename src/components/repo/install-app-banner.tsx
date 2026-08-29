import { Check, Zap } from "lucide-react";

/**
 * Estado de la GitHub App en la selección de repos (C-08). Dos caras:
 *
 * - **Sin instalar**: invitación con el botón de conectar y la recomendación de
 *   elegir "All repositories" — el selector de GitHub solo cubre los repos
 *   marcados en ese momento, así que quien vaya a añadir repos después evita
 *   tener que volver.
 * - **Instalada**: línea discreta con acceso a la configuración. No desaparece
 *   a propósito: un repo añadido más tarde no queda cubierto por una
 *   instalación de "Only select repositories", y sin este recordatorio nadie
 *   se entera hasta que echa en falta las notificaciones.
 *
 * Server component; sin slug configurado no pinta nada (en dev puede no haber App).
 */
export function InstallAppBanner({ installed = false }: { installed?: boolean }) {
  const slug = process.env.NEXT_PUBLIC_GITHUB_APP_SLUG;
  if (!slug) return null;

  if (installed) {
    return (
      <p
        data-testid="install-app-connected"
        className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-content-secondary"
      >
        <Check size={15} aria-hidden className="shrink-0 text-primary" />
        <span>GitHub App connected.</span>
        <a
          href={`https://github.com/settings/installations`}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="install-app-manage-link"
          className="text-primary hover:underline"
        >
          Manage which repos it covers ↗
        </a>
        <span className="text-content-secondary/70">
          — repos added later need to be included there too.
        </span>
      </p>
    );
  }

  return (
    <div
      data-testid="install-app-banner"
      className="mb-6 rounded-xl border border-primary/40 bg-primary/5 px-4 py-3"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="flex min-w-0 items-start gap-2 text-sm">
          <Zap size={16} aria-hidden className="mt-0.5 shrink-0 text-primary" />
          <span>
            <span className="font-medium">Keep your repos live.</span>{" "}
            <span className="text-content-secondary">
              Install the GitHub App on your repos: stars sync themselves and your subscribers
              get notified on every push. One click, read-only.
            </span>
          </span>
        </p>
        <a
          href={`https://github.com/apps/${slug}/installations/new`}
          data-testid="install-app-link"
          className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Connect
        </a>
      </div>
      <p className="mt-2 pl-6 text-xs text-content-secondary">
        GitHub will ask which repos to cover. <span className="font-medium">All repositories</span>{" "}
        is the one-and-done option: repos you add later are covered automatically.{" "}
        <span className="font-medium">Only select repositories</span> is stricter, but you&apos;ll
        need to come back each time you pick a new repo. Either way, snapstack only ever reads.
      </p>
    </div>
  );
}
