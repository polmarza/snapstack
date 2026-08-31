import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { FollowButton } from "@/components/follow/follow-button";
import { CardBackgroundLayer } from "@/components/feed/card-background";
import { ReadmeMarkdown } from "@/components/repo/readme-markdown";
import { RepoGithubLink } from "@/components/repo/repo-github-link";
import { SubscribeButton } from "@/components/repo/subscribe-button";
import { CloneButton } from "@/components/repo/clone-button";
import { cardBackground, languageColor } from "@/lib/card-seed";
import { createServiceClient } from "@/lib/db/client";
import { getFollowCounts, isFollowing } from "@/lib/db/follows";
import { listOwnedActiveRepos } from "@/lib/db/selection";
import { isSubscribed } from "@/lib/db/subscriptions";
import { listNotesForRepo } from "@/lib/db/notes";
import { NoteCard } from "@/components/notes/note-card";
import { getGithubAppToken } from "@/lib/db/github-app-tokens";
import { githubAppConfigured } from "@/lib/github/app-oauth";
import { isStarred } from "@/lib/github/starring";
import { StarButton } from "@/components/repo/star-button";
import { getProfileByClerkId } from "@/lib/db/profiles";
import { getActiveRepoByFullName } from "@/lib/db/repos";

export const dynamic = "force-dynamic";

interface RepoPageProps {
  params: Promise<{ owner: string; name: string }>;
}

export async function generateMetadata({ params }: RepoPageProps): Promise<Metadata> {
  const { owner, name } = await params;
  const repo = await getActiveRepoByFullName(createServiceClient(), owner, name).catch(() => null);
  if (!repo) return { title: "Repo not found" };

  const description = repo.description ?? `${repo.full_name} on snapstack`;
  const og = new URLSearchParams({ repoId: String(repo.github_repo_id), name });
  if (repo.primary_language) og.set("language", repo.primary_language);
  if (repo.description) og.set("description", repo.description);

  return {
    title: `${repo.full_name} · snapstack`,
    description,
    alternates: { canonical: `/r/${repo.full_name}` },
    openGraph: {
      siteName: "snapstack",
      url: `/r/${repo.full_name}`,
      title: `${repo.full_name} · snapstack`,
      description,
      images: [`/api/og?${og.toString()}`],
    },
  };
}

/** JSON-LD del repo. Textos de terceros: se escapa `<` como en el perfil. */
function repoJsonLd(repo: { full_name: string; description: string | null; url: string; primary_language: string | null }) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: repo.full_name,
    ...(repo.description ? { description: repo.description } : {}),
    url: `${base}/r/${repo.full_name}`,
    codeRepository: repo.url,
    ...(repo.primary_language ? { programmingLanguage: repo.primary_language } : {}),
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export default async function RepoDetailPage({ params }: RepoPageProps) {
  const { owner, name } = await params;
  const db = createServiceClient();
  const repo = await getActiveRepoByFullName(db, owner, name).catch(() => null);
  if (!repo) notFound();

  // Follow del autor: visible siempre que el repo tenga dueño y no seas tú —
  // también sin sesión (ahí el click abre el login). Con dueño, sus stats.
  const user = await currentUser();
  const viewer = user ? await getProfileByClerkId(db, user.id) : null;
  const isOwner = viewer !== null && viewer.id === repo.owner_profile_id;
  const showFollow = repo.owner_profile_id !== null && !isOwner;
  const alreadyFollowing =
    viewer && showFollow && repo.owner_profile_id
      ? await isFollowing(db, viewer.id, repo.owner_profile_id)
      : false;

  let ownerStats: { repos: number; stars: number; followers: number; following: number } | null = null;
  if (repo.owner_profile_id) {
    const [ownerRepos, counts] = await Promise.all([
      listOwnedActiveRepos(db, repo.owner_profile_id),
      getFollowCounts(db, repo.owner_profile_id),
    ]);
    ownerStats = {
      repos: ownerRepos.length,
      stars: ownerRepos.reduce((sum, r) => sum + ((r as { stars?: number }).stars ?? 0), 0),
      followers: counts.followers,
      following: counts.following,
    };
  }
  const alreadySubscribed = viewer ? await isSubscribed(db, viewer.id, repo.id) : false;

  // Las notas del repo, lo primero bajo la ficha: es lo que ha pasado desde
  // que se importó, y envejece antes que el README.
  const notes = await listNotesForRepo(db, repo.id).catch(() => []);

  // Estrella real (C-07): solo con la App configurada y sesión. Con token, se
  // consulta el estado inicial; sin él, el primer click lleva a conectar.
  const starEnabled = githubAppConfigured() && viewer !== null;
  let initialStarred: boolean | null = null;
  if (starEnabled && viewer) {
    try {
      const token = await getGithubAppToken(db, viewer.id);
      if (token) initialStarred = await isStarred(token, repo.full_name);
    } catch {
      initialStarred = null;
    }
  }

  const background = cardBackground(String(repo.github_repo_id), repo.primary_language);
  const repoName = repo.full_name.split("/").slice(1).join("/");

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: repoJsonLd(repo) }} />

      {/* La ficha, en grande: misma data procedural que la tarjeta y la og:image. */}
      <div
        data-testid="repo-detail-card"
        className="relative overflow-hidden rounded-2xl border border-edge"
      >
        <div className="relative flex aspect-[4/5] flex-col justify-between p-6 sm:aspect-[1.9/1] sm:p-8">
          <CardBackgroundLayer background={background} />
          <div className="relative flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: languageColor(repo.primary_language) }}
              />
              <span className="font-mono text-sm text-white/75">{repo.primary_language ?? "—"}</span>
            </div>
            {starEnabled ? (
              <StarButton
                fullName={repo.full_name}
                initialStars={repo.stars}
                initialStarred={initialStarred}
              />
            ) : (
              <span
                data-testid="repo-detail-stars"
                className="flex items-center gap-1.5 font-mono text-sm text-white/75"
              >
                <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.3">
                  <path d="M8 1.5l2 4.1 4.5.6-3.3 3.2.8 4.5L8 11.8l-4 2.1.8-4.5L1.5 6.2l4.5-.6L8 1.5z" strokeLinejoin="round" />
                </svg>
                <span className="sr-only">Stars:</span>
                {repo.stars}
              </span>
            )}
          </div>
          <div className="relative flex flex-col gap-2">
            <h1 className="break-words font-mono text-3xl font-bold text-white sm:text-4xl">{repoName}</h1>
            {repo.description ? <p className="text-white/70 sm:text-lg">{repo.description}</p> : null}
          </div>
        </div>
      </div>

      {/* Sección 1: el dueño con sus números, Follow a la derecha. */}
      <div
        data-testid="repo-detail-meta"
        className="mt-5 flex flex-wrap items-center justify-between gap-4 border-b border-edge pb-4"
      >
        <div className="flex min-w-0 items-center gap-3">
          {repo.owner_avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- avatar de GitHub, sin optimización
            <img src={repo.owner_avatar_url} alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-full border border-edge" />
          ) : null}
          <div className="flex min-w-0 flex-col items-start gap-0.5">
            {repo.owner_profile_id && repo.owner_login ? (
              <Link
                href={`/u/${repo.owner_login}`}
                data-testid="repo-detail-owner-link"
                className="truncate font-mono text-base font-medium hover:underline"
              >
                {repo.owner_login}
              </Link>
            ) : (
              <span data-testid="repo-detail-owner" className="truncate font-mono text-base text-content-secondary">
                {repo.owner_login ?? repo.full_name.split("/")[0]}
              </span>
            )}
            {ownerStats ? (
              <span
                data-testid="repo-detail-owner-stats"
                className="flex flex-wrap gap-x-3 font-mono text-xs text-content-secondary"
              >
                <span>{ownerStats.repos} {ownerStats.repos === 1 ? "repo" : "repos"}</span>
                <span>★ {ownerStats.stars}</span>
                <span>{ownerStats.followers} {ownerStats.followers === 1 ? "follower" : "followers"}</span>
                <span>{ownerStats.following} following</span>
              </span>
            ) : null}
          </div>
        </div>
        {showFollow && repo.owner_profile_id ? (
          <div className="shrink-0">
            <FollowButton
              profileId={repo.owner_profile_id}
              initialFollowing={alreadyFollowing}
              signalRepoId={repo.id}
              anonPrompt
            />
          </div>
        ) : null}
      </div>

      {/* Sección 2: el repo y sus acciones — GitHub en primario, clonar al
          portapapeles y la suscripción. Los clicks, de testigo a la derecha. */}
      <div data-testid="repo-detail-actions" className="border-b border-edge py-5">
        <h2 className="break-words font-mono text-2xl font-bold">{repoName}</h2>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <RepoGithubLink repoId={repo.id} url={repo.url} variant="button" />
          <CloneButton url={repo.url} />
          {viewer ? <SubscribeButton repoId={repo.id} initialSubscribed={alreadySubscribed} /> : null}
          <span
            data-testid="repo-detail-clicks"
            className="ml-auto font-mono text-xs text-content-secondary"
            title="Clicks through to GitHub"
          >
            clicks {repo.click_count ?? 0}
          </span>
        </div>
      </div>

      {repo.topics.length > 0 ? (
        <ul data-testid="repo-detail-topics" className="mt-4 flex flex-wrap gap-2">
          {repo.topics.map((topic) => (
            <li
              key={topic}
              className="rounded-full border border-edge px-2.5 py-0.5 font-mono text-xs text-content-secondary"
            >
              {topic}
            </li>
          ))}
        </ul>
      ) : null}

      {notes.length > 0 ? (
        <section data-testid="repo-notes" className="mt-8 flex flex-col gap-3">
          <h2 className="font-mono text-sm font-bold text-content-secondary">Notes</h2>
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              showRepo={false}
              canDelete={viewer !== null && viewer.id === note.author_profile_id}
            />
          ))}
        </section>
      ) : null}

      <section className="mt-8">
        {repo.readme_md ? (
          <ReadmeMarkdown markdown={repo.readme_md} fullName={repo.full_name} />
        ) : (
          <p data-testid="repo-readme-missing" className="text-sm text-content-secondary">
            README not imported yet —{" "}
            <a
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              read it on GitHub ↗
            </a>
          </p>
        )}
      </section>
    </main>
  );
}
