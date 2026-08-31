"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PencilLine, Send } from "lucide-react";
import { createNoteAction } from "@/app/api/notes/actions";
import { languageColor } from "@/lib/card-seed";
import { NOTE_MAX_LENGTH } from "@/lib/db/notes";

/**
 * Compositor de notas, arriba del feed (C-09).
 *
 * Empieza plegado —una línea que invita— y solo al enfocar aparece el resto.
 * El feed es para mirar; un formulario desplegado permanentemente arriba lo
 * convertiría en un formulario con feed debajo.
 *
 * **Lo primero que pide es el repo**, y no hay ninguno preseleccionado: el
 * texto no se puede escribir hasta elegirlo. Con un repo por defecto, quien no
 * mire el selector publica sobre el que tocara y tiene que borrar y reescribir
 * (una nota publicada no se edita) — y ese error solo se descubre después de
 * publicar. Un paso de más aquí ahorra un borrado allí.
 *
 * Si el usuario no tiene ningún repo activo, el compositor no se pinta: no hay
 * dónde anclar la nota.
 */
export interface ComposerRepo {
  id: string;
  full_name: string;
  primary_language: string | null;
}

export function NoteComposer({ repos }: { repos: ComposerRepo[] }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  // Vacío a propósito: elegir el repo es un acto, no un valor por defecto.
  const [repoId, setRepoId] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const textoRef = useRef<HTMLTextAreaElement>(null);

  if (repos.length === 0) return null;

  const restantes = NOTE_MAX_LENGTH - body.length;
  const puedePublicar = body.trim().length > 0 && restantes >= 0 && repoId !== "" && !pending;

  const publicar = () => {
    if (!puedePublicar) return;
    setError(null);
    startTransition(async () => {
      const result = await createNoteAction(repoId, body);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setBody("");
      setAbierto(false);
      // El feed es del servidor: refrescarlo es lo que hace aparecer la nota.
      router.refresh();
    });
  };

  if (!abierto) {
    return (
      <button
        type="button"
        data-testid="note-composer-open"
        onClick={() => setAbierto(true)}
        className="flex w-full items-center gap-3 rounded-xl border border-edge bg-surface px-5 py-4 text-left text-content-secondary transition-colors hover:border-primary hover:text-content"
      >
        <PencilLine size={18} strokeWidth={1.75} aria-hidden />
        What are you building?
      </button>
    );
  }

  const seleccionado = repos.find((r) => r.id === repoId) ?? null;

  return (
    <div data-testid="note-composer" className="rounded-xl border border-edge bg-surface p-5">
      <label className="flex items-center gap-2 font-mono text-xs text-content-secondary">
        <span
          aria-hidden
          className={`h-2.5 w-2.5 shrink-0 rounded-full ${seleccionado ? "" : "border border-edge"}`}
          style={seleccionado ? { backgroundColor: languageColor(seleccionado.primary_language) } : undefined}
        />
        About
        <select
          data-testid="note-composer-repo"
          value={repoId}
          onChange={(event) => {
            setRepoId(event.target.value);
            // Elegido el repo, el cursor va al texto: el paso extra no debe
            // costar un click de más.
            if (event.target.value !== "") requestAnimationFrame(() => textoRef.current?.focus());
          }}
          className="min-w-0 flex-1 rounded-lg border border-edge bg-background px-2 py-1 font-mono text-xs text-content transition-colors focus:border-primary focus:outline-none"
        >
          <option value="">Pick one of your repos…</option>
          {repos.map((repo) => (
            <option key={repo.id} value={repo.id}>
              {repo.full_name}
            </option>
          ))}
        </select>
      </label>

      <textarea
        ref={textoRef}
        data-testid="note-composer-body"
        value={body}
        rows={4}
        disabled={repoId === ""}
        maxLength={NOTE_MAX_LENGTH + 1}
        placeholder={
          repoId === ""
            ? "Pick a repo first."
            : "Shipped a new screen, hit a weird bug, changed my mind about the architecture…"
        }
        onChange={(event) => setBody(event.target.value)}
        className="mt-3 w-full resize-y rounded-lg border border-edge bg-background p-3 text-base leading-relaxed text-content transition-colors placeholder:text-content-secondary/60 focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      />

      {error ? (
        <p data-testid="note-composer-error" className="mt-2 text-sm text-error">
          {error}
        </p>
      ) : null}

      <div className="mt-3 flex items-center justify-end gap-3">
        <span
          data-testid="note-composer-count"
          className={`font-mono text-xs ${restantes < 0 ? "text-error" : "text-content-secondary"}`}
        >
          {restantes}
        </span>
        <button
          type="button"
          onClick={() => {
            setAbierto(false);
            setBody("");
            setError(null);
          }}
          className="rounded-lg px-3 py-2 text-sm text-content-secondary transition-colors hover:text-content"
        >
          Cancel
        </button>
        <button
          type="button"
          data-testid="note-composer-submit"
          disabled={!puedePublicar}
          onClick={publicar}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <Send size={16} strokeWidth={2.25} aria-hidden />
          {pending ? "Posting…" : "Post"}
        </button>
      </div>
    </div>
  );
}
