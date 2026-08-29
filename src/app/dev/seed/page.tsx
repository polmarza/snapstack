/**
 * Página de desarrollo: lista lo importado por `pnpm seed:trending` desde la base
 * de datos, renderizado con la ficha visual de M-04. No es el feed (M-06) ni parte
 * del producto: en producción devuelve 404.
 */

import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/db/client";
import { listActiveRepos, type RepoRow } from "@/lib/db/repos";

export const dynamic = "force-dynamic";

function cardUrl(repo: RepoRow): string {
  const params = new URLSearchParams({
    repoId: String(repo.github_repo_id),
    name: repo.full_name.split("/")[1] ?? repo.full_name,
  });
  if (repo.description) params.set("description", repo.description);
  if (repo.primary_language) params.set("language", repo.primary_language);
  return `/api/og?${params.toString()}`;
}

export default async function DevSeedPage() {
  if (process.env.NODE_ENV === "production") notFound();

  let repos: RepoRow[] = [];
  let error: string | null = null;
  try {
    repos = await listActiveRepos(createServiceClient(), 50);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-mono text-2xl font-bold">Repos semilla importados</h1>
      <p className="mt-2 text-content-secondary">
        Contenido real de la tabla <code className="font-mono">repos</code>. Se rellena con{" "}
        <code className="font-mono">pnpm seed:trending</code>.
      </p>

      {error ? (
        <p data-testid="seed-error" className="mt-8 text-error">
          No se pudo leer la base de datos: {error}
        </p>
      ) : repos.length === 0 ? (
        <p data-testid="seed-empty" className="mt-8 text-content-secondary">
          No hay repos importados todavía. Levanta Supabase local y ejecuta{" "}
          <code className="font-mono">pnpm seed:trending</code>.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {repos.map((repo) => (
            <figure key={repo.github_repo_id} data-testid="seed-card">
              {/* eslint-disable-next-line @next/next/no-img-element -- imagen del propio endpoint OG */}
              <img
                src={cardUrl(repo)}
                alt={`Ficha de ${repo.full_name}`}
                width={1200}
                height={630}
                className="w-full rounded-2xl border border-edge"
              />
              <figcaption className="mt-2 flex items-baseline justify-between font-mono text-sm text-content-secondary">
                <span>
                  {repo.full_name} · {repo.primary_language ?? "sin lenguaje"}
                </span>
                <span>★ {repo.stars}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </main>
  );
}
