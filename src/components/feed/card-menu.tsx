"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { MoreHorizontal } from "lucide-react";
import { reportRepoAction } from "@/app/api/reports/actions";

/**
 * Menú de la tarjeta (arriba a la derecha, junto a las estrellas). De momento
 * solo contiene reportar (S-01), que exige sesión: sin ella el menú no se pinta.
 */
export function CardMenu({ repoId }: { repoId: string }) {
  const { isSignedIn } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const [estado, setEstado] = useState<"menu" | "form" | "done">("menu");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);

  // Cerrar al pulsar fuera o con Escape: comportamiento esperado de un menú.
  useEffect(() => {
    if (!abierto) return;
    const fuera = (event: MouseEvent) => {
      if (!contenedor.current?.contains(event.target as Node)) setAbierto(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAbierto(false);
    };
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", escape);
    };
  }, [abierto]);

  if (!isSignedIn) return null;

  const enviar = async (event: React.FormEvent) => {
    event.preventDefault();
    setEnviando(true);
    const result = await reportRepoAction(repoId, reason);
    setEnviando(false);
    if (result.ok) {
      setEstado("done");
      setTimeout(() => setAbierto(false), 1500);
    } else {
      setError(result.error);
    }
  };

  return (
    <div ref={contenedor} className="relative">
      <button
        type="button"
        data-testid="card-menu-button"
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label="Repo options"
        onClick={() => {
          setAbierto((v) => !v);
          setEstado("menu");
          setError(null);
        }}
        className="rounded-lg p-1 text-white/75 transition-colors hover:bg-white/10 hover:text-white"
      >
        <MoreHorizontal size={18} strokeWidth={2} aria-hidden />
      </button>

      {abierto ? (
        <div
          data-testid="card-menu"
          className="absolute right-0 top-9 z-10 w-64 rounded-xl border border-edge bg-surface p-2 shadow-lg"
        >
          {estado === "done" ? (
            <p data-testid="report-done" className="px-2 py-1.5 text-xs text-content-secondary">
              Reported — thanks, we&apos;ll take a look.
            </p>
          ) : estado === "menu" ? (
            <button
              type="button"
              data-testid="report-button"
              onClick={() => setEstado("form")}
              className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-content-secondary hover:bg-background hover:text-error"
            >
              Report this repo
            </button>
          ) : (
            <form data-testid="report-form" onSubmit={enviar} className="flex flex-col gap-2 p-1">
              <input
                type="text"
                autoFocus
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="What's wrong with this repo?"
                maxLength={500}
                className="w-full rounded-lg border border-edge bg-background px-2 py-1.5 text-xs"
              />
              {error ? <span className="text-xs text-error">{error}</span> : null}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEstado("menu")}
                  className="rounded-lg px-2 py-1 text-xs text-content-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enviando || !reason.trim()}
                  className="rounded-lg border border-error px-2 py-1 text-xs text-error disabled:opacity-40"
                >
                  {enviando ? "Sending…" : "Report"}
                </button>
              </div>
            </form>
          )}
        </div>
      ) : null}
    </div>
  );
}
