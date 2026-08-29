"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FeedPage, FeedRepo } from "@/lib/db/feed-page";
import { RepoCard } from "./repo-card";

interface FeedListProps {
  initialRepos: FeedRepo[];
  initialCursor: string | null;
}

/**
 * Lista de scroll infinito (M-06): un centinela con IntersectionObserver pide la
 * siguiente página a /api/feed. El fin del feed es explícito; un fallo muestra
 * reintento inline y conserva lo ya cargado.
 */
export function FeedList({ initialRepos, initialCursor }: FeedListProps) {
  const [repos, setRepos] = useState<FeedRepo[]>(initialRepos);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !cursor) return;
    loadingRef.current = true;
    setError(null);
    try {
      const res = await fetch(`/api/feed?cursor=${encodeURIComponent(cursor)}`);
      if (!res.ok) throw new Error(`The feed responded with ${res.status}`);
      const page = (await res.json()) as FeedPage;
      setRepos((prev) => [...prev, ...page.repos]);
      setCursor(page.nextCursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      loadingRef.current = false;
    }
  }, [cursor]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !cursor || error) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadMore();
      },
      { rootMargin: "600px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [cursor, error, loadMore]);

  return (
    <div className="flex flex-col gap-6">
      {repos.map((repo) => (
        <RepoCard key={repo.id} repo={repo} />
      ))}

      {error ? (
        <div data-testid="feed-error" className="py-6 text-center">
          <p className="text-error">{error}</p>
          <button
            type="button"
            data-testid="feed-retry"
            onClick={() => void loadMore()}
            className="mt-2 rounded-lg border border-edge px-4 py-2 text-sm hover:border-primary"
          >
            Retry
          </button>
        </div>
      ) : cursor ? (
        <div ref={sentinelRef} data-testid="feed-sentinel" className="py-6 text-center font-mono text-sm text-content-secondary">
          Loading…
        </div>
      ) : (
        <p data-testid="feed-end" className="py-6 text-center font-mono text-sm text-content-secondary">
          — end of feed —
        </p>
      )}
    </div>
  );
}
