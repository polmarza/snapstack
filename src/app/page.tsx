import { FeedList } from "@/components/feed/feed-list";
import { createServiceClient } from "@/lib/db/client";
import { listFeedPage, type FeedPage } from "@/lib/db/feed-page";

export const dynamic = "force-dynamic";

export default async function Home() {
  let page: FeedPage | null = null;
  try {
    page = await listFeedPage(createServiceClient(), null);
  } catch {
    page = null;
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <h1 className="font-mono text-2xl font-bold">Snapstack</h1>
        <p className="mt-1 text-sm text-content-secondary">
          Qué están construyendo los devs, repo a repo.
        </p>
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
