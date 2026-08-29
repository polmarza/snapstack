import type { Metadata } from "next";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { AuthControls } from "@/components/auth/auth-controls";
import { FeedList } from "@/components/feed/feed-list";
import { createServiceClient } from "@/lib/db/client";
import { annotateFollowed, listFeedPage, type FeedPage } from "@/lib/db/feed-page";
import { listFollowedIds } from "@/lib/db/follows";
import { ensureProfile, getProfileByClerkId } from "@/lib/db/profiles";

export const dynamic = "force-dynamic";

const TAGLINE = "What devs are building, repo by repo.";

/**
 * La home es el enlace que más se comparte: sin Open Graph propio, snapstack.sh
 * se pega como un enlace pelado. La portada usa el mismo endpoint de fichas.
 */
export const metadata: Metadata = {
  title: "Snapstack — what devs are building",
  description:
    "A curated profile for your GitHub repos + a visual feed to discover what other devs are building.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Snapstack",
    title: "Snapstack — what devs are building",
    description: TAGLINE,
    images: [
      `/api/og?${new URLSearchParams({
        repoId: "snapstack",
        name: "Snapstack",
        description: TAGLINE,
      })}`,
    ],
  },
};

interface HomeProps {
  searchParams: Promise<{ filter?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const { filter } = await searchParams;

  let page: FeedPage | null = null;
  let signedIn = false;
  let followingView = false;
  try {
    const db = createServiceClient();
    const user = await currentUser();
    // Primer login → crea el perfil; siguientes → lo refresca. Sin sesión, no-op.
    await ensureProfile(db, user).catch(() => null);
    const profile = user ? await getProfileByClerkId(db, user.id) : null;
    signedIn = profile !== null;

    const followedIds = profile ? await listFollowedIds(db, profile.id) : null;
    followingView = filter === "following" && profile !== null;

    page = await listFeedPage(db, null, undefined, followingView ? { ownerIn: followedIds ?? [] } : {});
    if (followedIds) page = annotateFollowed(page, new Set(followedIds));
  } catch {
    page = null;
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-mono text-2xl font-bold">Snapstack</h1>
          <p className="mt-1 text-sm text-content-secondary">{TAGLINE}</p>
        </div>
        <AuthControls />
      </header>

      {signedIn ? (
        <nav data-testid="feed-tabs" className="mb-6 flex gap-2 font-mono text-sm">
          <Link
            href="/"
            data-testid="feed-tab-all"
            className={`rounded-lg px-3 py-1.5 ${!followingView ? "bg-surface text-content" : "text-content-secondary hover:text-content"}`}
          >
            All
          </Link>
          <Link
            href="/?filter=following"
            data-testid="feed-tab-following"
            className={`rounded-lg px-3 py-1.5 ${followingView ? "bg-surface text-content" : "text-content-secondary hover:text-content"}`}
          >
            Following
          </Link>
        </nav>
      ) : null}

      {page === null ? (
        <p data-testid="feed-unavailable" className="text-error">
          The feed is unavailable right now. Check back soon.
        </p>
      ) : page.repos.length === 0 ? (
        <p data-testid="feed-empty" className="text-content-secondary">
          {followingView
            ? "You're not following anyone yet. Explore the feed and follow the devs you like."
            : "No repos in the feed yet."}
        </p>
      ) : (
        <FeedList
          key={followingView ? "following" : "all"}
          initialRepos={page.repos}
          initialCursor={page.nextCursor}
          filter={followingView ? "following" : undefined}
        />
      )}
    </main>
  );
}
