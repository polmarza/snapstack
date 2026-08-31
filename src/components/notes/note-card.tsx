"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteNoteAction } from "@/app/api/notes/actions";
import { languageColor } from "@/lib/card-seed";
import type { FeedNote } from "@/lib/db/feed-page";
import { FollowButton } from "@/components/follow/follow-button";
import { timeAgo } from "@/lib/time-ago";

/**
 * Una nota en el feed, en el perfil o en el detalle del repo (C-09).
 *
 * Deliberadamente **más ligera que la ficha de repo**: sin fondo generado, sin
 * aspect-ratio fijo. La ficha es la portada de un proyecto y ocupa lo que ocupa;
 * una nota es una frase, y darle el mismo peso visual haría que el feed pareciera
 * el doble de lento. Lo que sí comparte es el ancla: abajo siempre está el repo
 * del que cuelga, con el punto de color de su lenguaje.
 *
 * El cuerpo se pinta como texto en un `<p>`: React escapa por defecto, y aquí no
 * se interpreta Markdown ni HTML a propósito.
 */
export function NoteCard({
  note,
  /** En el perfil y en el detalle el contexto ya está: sobra repetirlo. */
  showRepo = true,
  /** Con dueño: enseña el botón de borrar. */
  canDelete = false,
}: {
  note: FeedNote;
  showRepo?: boolean;
  canDelete?: boolean;
}) {
  const [deleted, setDeleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (deleted) return null;

  const author = note.author;
  const repo = note.repo;
  const color = languageColor(repo?.primary_language ?? null);

  return (
    <article
      data-testid="note-card"
      data-note-id={note.id}
      className="rounded-xl border border-edge bg-surface p-5"
    >
      <header className="flex items-start gap-3">
        {author?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- avatar de GitHub, sin optimización
          <img
            src={author.avatar_url}
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 rounded-full border border-edge"
          />
        ) : null}

        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
            {author ? (
              <Link
                href={`/u/${author.username}`}
                data-testid="note-author"
                className="truncate font-mono font-bold hover:text-primary"
              >
                {author.display_name ?? author.username}
              </Link>
            ) : null}
            <time
              dateTime={note.created_at}
              className="font-mono text-xs text-content-secondary"
            >
              {timeAgo(note.created_at)}
            </time>
          </p>
        </div>

        {note.author_followed !== undefined && note.author_profile_id ? (
          <FollowButton
            profileId={note.author_profile_id}
            initialFollowing={note.author_followed}
            size="sm"
          />
        ) : null}

        {canDelete ? (
          <button
            type="button"
            data-testid="note-delete"
            aria-label="Delete note"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await deleteNoteAction(note.id);
                if (result.ok) setDeleted(true);
                else setError(result.error);
              })
            }
            className="shrink-0 rounded-lg p-1.5 text-content-secondary transition-colors hover:text-error disabled:opacity-50"
          >
            <Trash2 size={16} strokeWidth={1.75} aria-hidden />
          </button>
        ) : null}
      </header>

      {/* `whitespace-pre-line` respeta los saltos que escribió el autor sin
          dejar que el texto se pegue al borde en móvil. */}
      <p data-testid="note-body" className="mt-3 whitespace-pre-line break-words text-base leading-relaxed">
        {note.body}
      </p>

      {error ? <p className="mt-2 text-sm text-error">{error}</p> : null}

      {showRepo && repo ? (
        <Link
          href={`/r/${repo.full_name}`}
          data-testid="note-repo"
          className="mt-4 flex items-center gap-2 border-t border-edge pt-3 font-mono text-sm text-content-secondary transition-colors hover:text-content"
        >
          <span
            aria-hidden
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="truncate">{repo.full_name}</span>
        </Link>
      ) : null}
    </article>
  );
}
