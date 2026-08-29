"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cardBackground, languageColor } from "@/lib/card-seed";
import type { FeedRepo } from "@/lib/db/feed-page";
import { CardBackgroundLayer } from "./card-background";

/**
 * Tarjeta del feed (M-06). El fondo es el de M-04 pintado en CSS: texto real,
 * legible a cualquier ancho (en móvil la tarjeta es más vertical). La imagen de
 * /api/og queda para og:image y embeds, no para el feed.
 */
export function RepoCard({ repo }: { repo: FeedRepo }) {
  const [expanded, setExpanded] = useState(false);
  const background = useMemo(
    () => cardBackground(String(repo.github_repo_id), repo.primary_language),
    [repo.github_repo_id, repo.primary_language],
  );

  const [ownerFromName, name] = repo.full_name.includes("/")
    ? [repo.full_name.split("/")[0], repo.full_name.split("/").slice(1).join("/")]
    : [null, repo.full_name];
  const ownerLogin = repo.owner_login ?? ownerFromName;

  return (
    <article
      data-testid="feed-card"
      data-repo-id={repo.github_repo_id}
      className="overflow-hidden rounded-2xl border border-edge bg-surface"
    >
      <div className="relative flex aspect-[4/5] flex-col justify-between p-6 sm:aspect-[1.9/1] sm:p-8">
        <CardBackgroundLayer background={background} />
        <div className="relative flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: languageColor(repo.primary_language) }}
            />
            <span className="font-mono text-sm text-white/75">
              {repo.primary_language ?? "—"}
            </span>
          </div>
          {/* Indicador pasivo por ahora; será botón de estrella real (GitHub App,
              permiso Starring) cuando exista login — ver MEJORA-02. */}
          <span data-testid="feed-card-stars" className="flex items-center gap-1.5 font-mono text-sm text-white/75">
            <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.3">
              <path d="M8 1.5l2 4.1 4.5.6-3.3 3.2.8 4.5L8 11.8l-4 2.1.8-4.5L1.5 6.2l4.5-.6L8 1.5z" strokeLinejoin="round" />
            </svg>
            <span className="sr-only">Stars:</span>
            {repo.stars}
          </span>
        </div>
        <div className="relative flex flex-col gap-2">
          <h2 className="font-mono text-2xl font-bold text-white sm:text-3xl">{name}</h2>
          {repo.description ? (
            <p className={`text-white/70 sm:text-lg ${expanded ? "" : "line-clamp-2"}`}>
              {repo.description}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 px-4 py-3">
        {(() => {
          const identity = (
            <>
              {repo.owner_avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- avatar pequeño de GitHub, sin optimización
                <img
                  src={repo.owner_avatar_url}
                  alt=""
                  width={20}
                  height={20}
                  className="h-5 w-5 shrink-0 rounded-full"
                />
              ) : null}
              <span data-testid="feed-card-owner" className="truncate">{ownerLogin ?? "—"}</span>
            </>
          );
          // Solo los repos con dueño en Snapstack enlazan a un perfil; las
          // semillas del trending no tienen perfil que abrir.
          return repo.owner_profile_id && repo.owner_login ? (
            <Link
              href={`/u/${repo.owner_login}`}
              data-testid="feed-card-owner-link"
              className="flex min-w-0 items-center gap-2 font-mono text-sm text-content-secondary hover:text-content"
            >
              {identity}
            </Link>
          ) : (
            <div className="flex min-w-0 items-center gap-2 font-mono text-sm text-content-secondary">
              {identity}
            </div>
          );
        })()}
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            data-testid="feed-card-expand"
            onClick={() => setExpanded((v) => !v)}
            className="text-sm text-content-secondary hover:text-content"
            aria-expanded={expanded}
          >
            {expanded ? "Less" : "More"}
          </button>
          <a
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="feed-card-repo-link"
            className="text-sm text-primary hover:underline"
          >
            View on GitHub ↗
          </a>
        </div>
      </div>

      {expanded ? (
        <div data-testid="feed-card-details" className="border-t border-edge px-4 py-3">
          {repo.topics.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {repo.topics.map((topic) => (
                <li
                  key={topic}
                  className="rounded-full border border-edge px-3 py-1 font-mono text-xs text-content-secondary"
                >
                  {topic}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-content-secondary">No topics declared.</p>
          )}
        </div>
      ) : null}
    </article>
  );
}
