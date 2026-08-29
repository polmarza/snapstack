import { Zap } from "lucide-react";
import Link from "next/link";
import { InstallScopeDialog } from "./install-scope-dialog";

/**
 * Aviso de instalación de la GitHub App (C-08) en la selección de repos: solo
 * mientras no esté conectada. El estado permanente y su gestión viven en
 * Settings (`GithubAppSection`) — aquí sobra en cuanto deja de haber algo que
 * hacer. Server component; sin slug configurado no pinta nada.
 */
export function InstallAppBanner({ installed = false }: { installed?: boolean }) {
  const slug = process.env.NEXT_PUBLIC_GITHUB_APP_SLUG;
  if (!slug || installed) return null;

  return (
    <div
      data-testid="install-app-banner"
      className="mb-6 rounded-xl border border-primary/40 bg-primary/5 px-4 py-3"
    >
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
      {/* La explicación de los alcances vive en el modal: aquí era letra
          pequeña justo donde hay que decidir. */}
      <div className="mt-3 flex flex-wrap items-center gap-2 pl-6">
        <a
          href={`https://github.com/apps/${slug}/installations/new`}
          data-testid="install-app-link"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Connect
        </a>
        <InstallScopeDialog />
        <Link
          href="/settings/account"
          data-testid="install-app-settings-link"
          className="text-sm text-content-secondary hover:text-content"
        >
          Manage in settings
        </Link>
      </div>
    </div>
  );
}
