import { currentUser } from "@clerk/nextjs/server";
import { AuthControls } from "@/components/auth/auth-controls";
import { FeedList } from "@/components/feed/feed-list";
import { createServiceClient } from "@/lib/db/client";
import { listFeedPage, type FeedPage } from "@/lib/db/feed-page";
import { ensureProfile } from "@/lib/db/profiles";

export const dynamic = "force-dynamic";

export default async function Home() {
  let page: FeedPage | null = null;
  try {
    const db = createServiceClient();
    // Primer login → crea el perfil; siguientes → lo refresca. Sin sesión, no-op.
    await ensureProfile(db, await currentUser()).catch(() => null);
    page = await listFeedPage(db, null);
  } catch {
    page = null;
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-mono text-2xl font-bold">Snapstack</h1>
          <p className="mt-1 text-sm text-content-secondary">
            Qué están construyendo los devs, repo a repo.
          </p>
        </div>
        <AuthControls />
      </header>

      {page === null ? (
        <p data-testid="feed-unavailable" className="text-error">
          El feed no está disponible ahora mismo. Vuelve en un rato.
        </p>
      ) : page.repos.length === 0 ? (
        <p data-testid="feed-empty" className="text-content-secondary">
          Todavía no hay repos en el feed.
        </p>
      ) : (
        <FeedList initialRepos={page.repos} initialCursor={page.nextCursor} />
      )}
    </main>
  );
}
