import { Check, Plug } from "lucide-react";
import { InstallScopeDialog } from "@/components/repo/install-scope-dialog";

/**
 * Casa permanente de la conexión con la GitHub App (C-08), en Settings: el
 * estado se consulta aquí, no en la pantalla de selección, donde solo cabe un
 * aviso mientras falta.
 */
export function GithubAppSection({ installed }: { installed: boolean }) {
  const slug = process.env.NEXT_PUBLIC_GITHUB_APP_SLUG;
  if (!slug) return null;

  return (
    <section data-testid="github-app-section" className="mb-10">
      <h2 className="font-mono text-lg font-bold">GitHub App</h2>
      <p className="mt-1 text-sm text-content-secondary">
        Connecting the app keeps your repos in sync: stars update themselves and the devs
        subscribed to your repos get notified when you push. Read-only, always.
      </p>

      <p
        data-testid="github-app-status"
        data-installed={installed}
        className="mt-3 flex items-center gap-2 text-sm"
      >
        {installed ? (
          <>
            <Check size={16} aria-hidden className="text-primary" />
            <span>Connected.</span>
            <span className="text-content-secondary">
              Repos you add later need to be included in the app too.
            </span>
          </>
        ) : (
          <>
            <Plug size={16} aria-hidden className="text-content-secondary" />
            <span className="text-content-secondary">Not connected yet.</span>
          </>
        )}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {installed ? (
          <a
            href="https://github.com/settings/installations"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="github-app-manage"
            className="rounded-lg border border-edge px-4 py-2 text-sm font-medium text-content-secondary transition-colors hover:text-content"
          >
            Manage which repos it covers ↗
          </a>
        ) : (
          <a
            href={`https://github.com/apps/${slug}/installations/new`}
            data-testid="github-app-connect"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Connect
          </a>
        )}
        <InstallScopeDialog />
      </div>
    </section>
  );
}
