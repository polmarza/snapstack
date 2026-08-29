import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { FollowButton } from "@/components/follow/follow-button";
import { CardBackgroundLayer } from "@/components/feed/card-background";
import { ReadmeMarkdown } from "@/components/repo/readme-markdown";
import { RepoGithubLink } from "@/components/repo/repo-github-link";
import { cardBackground, languageColor } from "@/lib/card-seed";
import { createServiceClient } from "@/lib/db/client";
import { isFollowing } from "@/lib/db/follows";
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

  // Follow del autor, como en la tarjeta: solo si el repo tiene dueño en snapstack.
  const user = await currentUser();
  const viewer = user ? await getProfileByClerkId(db, user.id) : null;
  const canFollow =
    viewer !== null && repo.owner_profile_id !== null && viewer.id !== repo.owner_profile_id;
  const alreadyFollowing =
    canFollow && repo.owner_profile_id ? await isFollowing(db, viewer.id, repo.owner_profile_id) : false;

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
          </div>
          <div className="relative flex flex-col gap-2">
            <h1 className="break-words font-mono text-3xl font-bold text-white sm:text-4xl">{repoName}</h1>
            {repo.description ? <p className="text-white/70 sm:text-lg">{repo.description}</p> : null}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {repo.owner_profile_id && repo.owner_login ? (
            <Link
              href={`/u/${repo.owner_login}`}
              data-testid="repo-detail-owner-link"
              className="flex min-w-0 items-center gap-2 font-mono text-sm text-content-secondary hover:text-content"
            >
              {repo.owner_avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- avatar de GitHub, sin optimización
                <img src={repo.owner_avatar_url} alt="" width={20} height={20} className="h-5 w-5 rounded-full" />
              ) : null}
              <span className="truncate">{repo.owner_login}</span>
            </Link>
          ) : (
            <span data-testid="repo-detail-owner" className="font-mono text-sm text-content-secondary">
              {repo.owner_login ?? repo.full_name.split("/")[0]}
            </span>
          )}
          {canFollow && repo.owner_profile_id ? (
            <FollowButton
              profileId={repo.owner_profile_id}
              initialFollowing={alreadyFollowing}
              signalRepoId={repo.id}
              size="sm"
            />
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span
            data-testid="repo-detail-clicks"
            className="font-mono text-xs text-content-secondary"
            title="Clicks through to GitHub"
          >
            clicks {repo.click_count ?? 0}
          </span>
          <RepoGithubLink repoId={repo.id} url={repo.url} />
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

      <section className="mt-8 border-t border-edge pt-6">
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
