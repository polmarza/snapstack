"use client";

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

  const [owner, name] = repo.full_name.includes("/")
    ? [repo.full_name.split("/")[0], repo.full_name.split("/").slice(1).join("/")]
    : [null, repo.full_name];

  return (
    <article
      data-testid="feed-card"
      data-repo-id={repo.github_repo_id}
      className="overflow-hidden rounded-2xl border border-edge bg-surface"
    >
      <div className="relative flex aspect-[4/5] flex-col justify-between p-6 sm:aspect-[1.9/1] sm:p-8">
        <CardBackgroundLayer background={background} />
        <div className="relative flex items-center gap-2">
          <span
            aria-hidden
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: languageColor(repo.primary_language) }}
          />
          <span className="font-mono text-sm text-white/75">
            {repo.primary_language ?? "—"}
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
        <div className="flex min-w-0 items-baseline gap-3 font-mono text-sm text-content-secondary">
          <span className="truncate">{owner ? `${owner}/` : ""}{name}</span>
          <span className="shrink-0">★ {repo.stars}</span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            data-testid="feed-card-expand"
            onClick={() => setExpanded((v) => !v)}
            className="text-sm text-content-secondary hover:text-content"
            aria-expanded={expanded}
          >
            {expanded ? "Menos" : "Más"}
          </button>
          <a
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="feed-card-repo-link"
            className="text-sm text-primary hover:underline"
          >
            Ver en GitHub ↗
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
            <p className="text-sm text-content-secondary">Sin topics declarados.</p>
          )}
        </div>
      ) : null}
    </article>
  );
}
