import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { RepoCard } from "@/components/feed/repo-card";
import { FollowButton } from "@/components/follow/follow-button";
import { createServiceClient } from "@/lib/db/client";
import type { FeedRepo } from "@/lib/db/feed-page";
import { isFollowing } from "@/lib/db/follows";
import { getProfileByClerkId, getProfileByUsername } from "@/lib/db/profiles";
import { listOwnedActiveRepos } from "@/lib/db/selection";

export const dynamic = "force-dynamic";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfileByUsername(createServiceClient(), username).catch(() => null);
  if (!profile) return { title: "Profile not found" };

  const name = profile.display_name ?? profile.username;
  const og = new URLSearchParams({
    repoId: profile.username,
    name: profile.username,
    description: `${name} on Snapstack — a curated selection of their repos`,
  });
  return {
    title: `${profile.username} · Snapstack`,
    description: `What ${name} is building — their curated GitHub repos on Snapstack.`,
    openGraph: { images: [`/api/og?${og.toString()}`] },
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const db = createServiceClient();
  const profile = await getProfileByUsername(db, username).catch(() => null);
  if (!profile) notFound();

  const repos = (await listOwnedActiveRepos(db, profile.id)) as FeedRepo[];
  repos.sort((a, b) => b.imported_at.localeCompare(a.imported_at));

  // Botón Follow: solo con sesión y sobre perfiles ajenos.
  const user = await currentUser();
  const viewer = user ? await getProfileByClerkId(db, user.id) : null;
  const canFollow = viewer !== null && viewer.id !== profile.id;
  const alreadyFollowing = canFollow ? await isFollowing(db, viewer.id, profile.id) : false;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link href="/" className="font-mono text-sm text-content-secondary hover:text-content">
        ← Back to feed
      </Link>

      <header data-testid="profile-header" className="mt-6 mb-8 flex items-center gap-4">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- avatar de GitHub, sin optimización
          <img
            src={profile.avatar_url}
            alt=""
            width={64}
            height={64}
            className="h-16 w-16 rounded-full border border-edge"
          />
        ) : null}
        <div className="min-w-0">
          <h1 className="truncate font-mono text-2xl font-bold">
            {profile.display_name ?? profile.username}
          </h1>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-content-secondary">
            <span data-testid="profile-username" className="font-mono">@{profile.username}</span>
            <a
              href={`https://github.com/${profile.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              GitHub ↗
            </a>
            <span className="font-mono">
              {repos.length} {repos.length === 1 ? "repo" : "repos"}
            </span>
          </p>
        </div>
        {canFollow ? (
          <div className="ml-auto shrink-0">
            <FollowButton profileId={profile.id} initialFollowing={alreadyFollowing} />
          </div>
        ) : null}
      </header>

      {repos.length === 0 ? (
        <p data-testid="profile-empty" className="text-content-secondary">
          No repos selected yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {repos.map((repo) => (
            <RepoCard key={repo.id} repo={repo} />
          ))}
        </div>
      )}
    </main>
  );
}
