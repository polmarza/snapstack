/**
 * Página de demo en local: la nota y el compositor con datos de mentira, para
 * poder comprobarlos a ojo y por interfaz sin sesión de Clerk.
 *
 * Existe por la misma razón que `/dev/cards`: el proyecto no testea contra
 * Clerk (ver `docs/testing.md`), así que sin esto la tarjeta de nota y el
 * compositor solo se podrían mirar a mano. Lo que **no** cubre es publicar de
 * verdad — eso exige sesión y repos propios, y se valida a mano.
 *
 * En producción devuelve 404.
 */

import { notFound } from "next/navigation";
import { NoteCard } from "@/components/notes/note-card";
import { NoteComposer } from "@/components/notes/note-composer";
import type { FeedNote } from "@/lib/db/feed-page";

const REPOS = [
  { id: "11111111-1111-1111-1111-111111111111", full_name: "polmarza/snapstack", primary_language: "TypeScript" },
  { id: "22222222-2222-2222-2222-222222222222", full_name: "polmarza/otro-repo", primary_language: "Rust" },
];

const NOTAS: FeedNote[] = [
  {
    id: "aaaaaaaa-1111-1111-1111-111111111111",
    author_profile_id: "autor-1",
    repo_id: REPOS[0].id,
    body: "Shipped the note composer. It asks for the repo first on purpose — a note is always a note about something you are building.",
    created_at: new Date(Date.UTC(2026, 7, 31, 9, 0, 0)).toISOString(),
    author: { username: "polmarza", display_name: "Pol Marzà", avatar_url: null },
    repo: { id: REPOS[0].id, full_name: REPOS[0].full_name, primary_language: "TypeScript", github_repo_id: 1 },
  },
  {
    id: "aaaaaaaa-2222-2222-2222-222222222222",
    author_profile_id: "autor-1",
    repo_id: REPOS[1].id,
    body: "Found a bug I did not expect:\n\nthe cursor skipped a page when two items shared a timestamp.\n\nFixed by tie-breaking on the id.",
    created_at: new Date(Date.UTC(2026, 7, 30, 18, 30, 0)).toISOString(),
    author: { username: "polmarza", display_name: "Pol Marzà", avatar_url: null },
    repo: { id: REPOS[1].id, full_name: REPOS[1].full_name, primary_language: "Rust", github_repo_id: 2 },
  },
];

export default function DevNotesPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-mono text-2xl font-bold">Demo de notas</h1>
      <p className="mt-2 text-content-secondary">
        Compositor y tarjetas con datos de mentira. Esta página los pinta{" "}
        <strong className="font-semibold text-content">como si hubiera sesión</strong>, que es
        justamente lo que la hace testeable sin Clerk. En el producto, el compositor solo se
        renderiza con sesión (ver <code className="font-mono text-sm">app/(feed)/page.tsx</code>),
        y publicar sin ella lo rechaza la server action.
      </p>

      <div className="mt-8 flex flex-col gap-6">
        <NoteComposer repos={REPOS} />
        {NOTAS.map((note) => (
          <NoteCard key={note.id} note={note} />
        ))}
        <NoteCard note={NOTAS[0]} showRepo={false} />
      </div>
    </main>
  );
}
