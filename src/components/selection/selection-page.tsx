import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/db/client";
import { ensureProfile, getProfileByClerkId } from "@/lib/db/profiles";
import { listOwnedActiveRepos, selectionLimit } from "@/lib/db/selection";
import { getGithubToken } from "@/lib/github/token";
import { listPublicRepos } from "@/lib/github/user-repos";
import { RepoSelector } from "./repo-selector";

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

  const current = await listOwnedActiveRepos(db, profile.id);
  const initialSelected = current.map((row) => row.full_name);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Link
        href="/"
        data-testid="back-to-feed"
        className="font-mono text-sm text-content-secondary hover:text-content"
      >
        ← Back to feed
      </Link>
      <header className="mt-4 mb-6">
        <h1 className="font-mono text-2xl font-bold">{title}</h1>
        <p className="mt-1 text-sm text-content-secondary">{intro}</p>
      </header>

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
