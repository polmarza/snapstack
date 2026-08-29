"use client";

import { trackSignal } from "@/lib/signals/tracker";

/** Enlace al repo en GitHub desde el detalle: emite click_repo, como la tarjeta (M-09). */
export function RepoGithubLink({
  repoId,
  url,
  variant = "link",
}: {
  repoId: string;
  url: string;
  /** "button" = botón primario en la fila de acciones del detalle. */
  variant?: "link" | "button";
}) {
  const className =
    variant === "button"
      ? "flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
      : "text-sm text-primary hover:underline";
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      data-testid="repo-detail-github-link"
      onClick={() => trackSignal({ repoId, type: "click_repo" })}
      className={className}
    >
      View on GitHub ↗
    </a>
  );
}
