"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FeedItem, FeedPage } from "@/lib/db/feed-page";
import { NoteCard } from "@/components/notes/note-card";
import { RepoCard } from "./repo-card";

interface FeedListProps {
  initialItems: FeedItem[];
  initialCursor: string | null;
  /** "following" restringe las páginas siguientes al filtro de seguidos (M-07). */
  filter?: string;
  /** Perfil del visitante: sus propias notas llevan botón de borrar. */
  viewerProfileId?: string | null;
}

/**
 * Lista de scroll infinito (M-06): un centinela con IntersectionObserver pide la
 * siguiente página a /api/feed. El fin del feed es explícito; un fallo muestra
 * reintento inline y conserva lo ya cargado.
 *
 * Desde C-11 la lista es mixta: cada ítem sabe si es una ficha de repo o una
 * nota, y se pinta con el componente que le toca.
 */
export function FeedList({ initialItems, initialCursor, filter, viewerProfileId = null }: FeedListProps) {
  const [items, setItems] = useState<FeedItem[]>(initialItems);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !cursor) return;
    loadingRef.current = true;
    setError(null);
    try {
      const params = new URLSearchParams({ cursor });
      if (filter) params.set("filter", filter);
      const res = await fetch(`/api/feed?${params.toString()}`);
      if (!res.ok) throw new Error(`The feed responded with ${res.status}`);
      const page = (await res.json()) as FeedPage;
      setItems((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      loadingRef.current = false;
    }
  }, [cursor, filter]);

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
      {items.map((item) =>
        item.kind === "repo" ? (
          <RepoCard key={`repo-${item.id}`} repo={item.repo} />
        ) : (
          <NoteCard
            key={`note-${item.id}`}
            note={item.note}
            canDelete={viewerProfileId !== null && item.note.author_profile_id === viewerProfileId}
          />
        ),
      )}

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
