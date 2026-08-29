"use client";

import { trackSignal } from "@/lib/signals/tracker";

/** Enlace al repo en GitHub desde el detalle: emite click_repo, como la tarjeta (M-09). */
export function RepoGithubLink({ repoId, url }: { repoId: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      data-testid="repo-detail-github-link"
      onClick={() => trackSignal({ repoId, type: "click_repo" })}
      className="text-sm text-primary hover:underline"
    >
      View on GitHub ↗
    </a>
  );
}
