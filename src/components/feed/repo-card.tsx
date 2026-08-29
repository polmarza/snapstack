"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { cardBackground, languageColor } from "@/lib/card-seed";
import type { FeedRepo } from "@/lib/db/feed-page";
import { dwellEnter, dwellLeave } from "@/lib/signals/tracker";
import { FollowButton } from "@/components/follow/follow-button";
import { CardBackgroundLayer } from "./card-background";
import { CardMenu } from "./card-menu";

/**
 * Tarjeta del feed (M-06). El fondo es el de M-04 pintado en CSS: texto real,
 * legible a cualquier ancho (en móvil la tarjeta es más vertical). La imagen de
 * /api/og queda para og:image y embeds, no para el feed.
 *
 * Todo está a la vista: no hay desplegable. Los topics solo aparecen si los hay,
 * el follow va junto al autor y reportar vive en el menú de la esquina.
 */
export function RepoCard({ repo }: { repo: FeedRepo }) {
  const articleRef = useRef<HTMLElement>(null);
  const background = useMemo(
    () => cardBackground(String(repo.github_repo_id), repo.primary_language),
    [repo.github_repo_id, repo.primary_language],
  );

  // Señal implícita de permanencia (M-09): tramos con la tarjeta ≥50 % visible.
  useEffect(() => {
    const element = articleRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) dwellEnter(repo.id);
          else dwellLeave(repo.id);
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      dwellLeave(repo.id);
    };
  }, [repo.id]);

  const [ownerFromName, name] = repo.full_name.includes("/")
    ? [repo.full_name.split("/")[0], repo.full_name.split("/").slice(1).join("/")]
    : [null, repo.full_name];
  const ownerLogin = repo.owner_login ?? ownerFromName;

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

  return (
    <article
      ref={articleRef}
      data-testid="feed-card"
      data-repo-id={repo.github_repo_id}
      className="overflow-hidden rounded-2xl border border-edge bg-surface"
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
            <span className="font-mono text-sm text-white/75">
              {repo.primary_language ?? "—"}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Indicador pasivo por ahora; será botón de estrella real (GitHub App,
                permiso Starring) cuando exista la App — ver MEJORA-02. */}
            <span
              data-testid="feed-card-stars"
              className="flex items-center gap-1.5 px-1 font-mono text-sm text-white/75"
            >
              <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.3">
                <path d="M8 1.5l2 4.1 4.5.6-3.3 3.2.8 4.5L8 11.8l-4 2.1.8-4.5L1.5 6.2l4.5-.6L8 1.5z" strokeLinejoin="round" />
              </svg>
              <span className="sr-only">Stars:</span>
              {repo.stars}
            </span>
            <CardMenu repoId={repo.id} />
          </div>
        </div>

        <div className="relative flex flex-col gap-2">
          <h2 className="font-mono text-2xl font-bold text-white sm:text-3xl">
            <Link
              href={`/r/${repo.full_name}`}
              data-testid="feed-card-detail-link"
              className="hover:underline"
            >
              {name}
            </Link>
          </h2>
          {repo.description ? (
            <p className="line-clamp-3 text-white/70 sm:text-lg">{repo.description}</p>
          ) : null}

          {/* Topics y clicks viven dentro del degradado: el pie queda para el
              autor (en móvil no cabía todo abajo sin apelotonarse). */}
          <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
              {repo.topics.length > 0 ? (
                <ul data-testid="feed-card-topics" className="flex min-w-0 flex-wrap gap-1.5">
                  {repo.topics.slice(0, 4).map((topic) => (
                    <li
                      key={topic}
                      className="rounded-full border border-white/25 px-2.5 py-0.5 font-mono text-xs text-white/70"
                    >
                      {topic}
                    </li>
                  ))}
                </ul>
              ) : (
                <span />
              )}
              <span
                data-testid="feed-card-clicks"
                className="font-mono text-xs text-white/60"
                title="Clicks through to GitHub"
              >
                clicks {repo.click_count ?? 0}
              </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          {repo.owner_profile_id && repo.owner_login ? (
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
          )}

          {/* El follow, junto al autor: es a la persona a quien se sigue. */}
          {repo.owner_profile_id && repo.owner_followed !== undefined ? (
            <FollowButton
              profileId={repo.owner_profile_id}
              initialFollowing={repo.owner_followed}
              signalRepoId={repo.id}
              size="sm"
            />
          ) : null}
        </div>

        {/* "View on GitHub" vive solo en la vista detalle (C-05): el destino
            natural de la tarjeta es su página. */}
      </div>
    </article>
  );
}
