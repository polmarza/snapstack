import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/db/client";
import { ensureProfile, getProfileByClerkId } from "@/lib/db/profiles";
import { listOwnedActiveRepos, selectionLimit } from "@/lib/db/selection";
import { getGithubToken } from "@/lib/github/token";
import { listPublicRepos } from "@/lib/github/user-repos";
import { skipOnboardingAction } from "@/app/onboarding/actions";
import { RepoSelector } from "./repo-selector";
import { InstallAppBanner } from "@/components/repo/install-app-banner";
import { syncInstallationState } from "@/lib/db/installation";

/**
 * Página de selección compartida por /onboarding y /settings/repos (M-02/M-03).
 * Sin sesión redirige a la home (el login vive allí, en la cabecera).
 */
export async function SelectionPage({
  mode,
  title,
  intro,
}: {
  mode: "onboarding" | "settings";
  title: string;
  intro: string;
}) {
  const user = await currentUser();
  if (!user) redirect("/");

  const db = createServiceClient();
  await ensureProfile(db, user);
  const profile = await getProfileByClerkId(db, user.id);
  if (!profile) redirect("/");

  const token = await getGithubToken(user.id);
  const limit = selectionLimit();

  let items = null;
  let loadError: string | null = null;
  try {
    if (!token) throw new Error("Sin token de GitHub");
    items = await listPublicRepos(token);
  } catch {
    loadError = "We couldn't list your GitHub repos. Reload, or sign in with GitHub again.";
  }

  // Aquí aterriza el Setup URL tras instalar: comprobar el estado real evita
  // que el aviso siga puesto cuando la instalación ya existe (C-08).
  const installationId = await syncInstallationState(
    db,
    profile.id,
    profile.github_installation_id ?? null,
  ).catch(() => profile.github_installation_id ?? null);

  const current = await listOwnedActiveRepos(db, profile.id);
  const initialSelected = current.map((row) => row.full_name);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* Sin enlaces de vuelta: la navegación (lateral en desktop, inferior en
          móvil) ya lleva a cualquier sitio desde cualquier página. */}
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-mono text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-content-secondary">{intro}</p>
        </div>
        {mode === "onboarding" ? (
          // La salida del onboarding: sin ella, quien no quiera importar nada
          // quedaría atrapado en la redirección de la home.
          <form action={skipOnboardingAction}>
            <button
              type="submit"
              data-testid="skip-onboarding"
              className="shrink-0 font-mono text-sm text-content-secondary hover:text-content"
            >
              Skip for now →
            </button>
          </form>
        ) : null}
      </header>

      {/* C-08: aviso solo mientras falte conectar; el estado permanente y su
          gestión viven en Settings. */}
      <InstallAppBanner installed={installationId != null} />

      {loadError || !items ? (
        <p data-testid="selection-error" className="text-error">{loadError}</p>
      ) : items.length === 0 ? (
        <p data-testid="selection-empty" className="text-content-secondary">
          We found no public repos (forks don&apos;t count) on your GitHub account.
        </p>
      ) : (
        <RepoSelector items={items} initialSelected={initialSelected} limit={limit} mode={mode} />
      )}
    </main>
  );
}
