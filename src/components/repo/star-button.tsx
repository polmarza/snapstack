"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { setStarAction } from "@/app/api/github/star-actions";

interface StarButtonProps {
  fullName: string;
  initialStars: number;
  /** null = sin token aún (el primer click lleva a conectar la App). */
  initialStarred: boolean | null;
}

/**
 * Estrella real (C-07): pulsar da/quita la estrella en GitHub en tu nombre.
 * Optimista con el contador. Sin autorización, redirige al OAuth de la App con
 * `?star=1` en la vuelta: al aterrizar de nuevo aquí, la estrella pendiente se
 * da sola — sin segundo click. Los errores se enseñan, no se tragan.
 */
export function StarButton({ fullName, initialStars, initialStarred }: StarButtonProps) {
  const { isSignedIn } = useAuth();
  const pathname = usePathname();
  const [starred, setStarred] = useState(initialStarred ?? false);
  const [stars, setStars] = useState(initialStars);
  const [error, setError] = useState<{ text: string; url?: string; label?: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const autoFired = useRef(false);

  const apply = (next: boolean) => {
    setError(null);
    setStarred(next);
    setStars((s) => s + (next ? 1 : -1));
    startTransition(async () => {
      const result = await setStarAction(fullName, next);
      if (result.needsConnect) {
        // Navegación de documento completo a propósito: el endpoint fija las
        // cookies del OAuth y redirige a GitHub — el router de Next no pinta
        // nada aquí.
        const returnTo = `${pathname}?star=1`;
        window.location.href = `/api/github/connect?from=${encodeURIComponent(returnTo)}`;
        return;
      }
      if (!result.ok) {
        setStarred(!next);
        setStars((s) => s + (next ? -1 : 1));
        setError(
          result.error
            ? { text: result.error, url: result.fixUrl, label: result.fixLabel }
            : null,
        );
      }
    });
  };

  // Vuelta del OAuth con la estrella pendiente (?star=1): darla sola, una vez,
  // y limpiar la URL para que recargar no repita el gesto.
  useEffect(() => {
    if (autoFired.current || !isSignedIn) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("star") !== "1") return;
    autoFired.current = true;
    params.delete("star");
    const query = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
    // La estrella pendiente se retoma fuera del render del efecto: es la misma
    // interacción del usuario, diferida por el viaje a GitHub.
    if (initialStarred !== true) setTimeout(() => apply(true), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar
  }, [isSignedIn]);

  if (!isSignedIn) return null;

  return (
    <span className="relative">
      <button
        type="button"
        data-testid="star-button"
        data-starred={starred}
        onClick={() => apply(!starred)}
        disabled={pending}
        title={starred ? "Unstar on GitHub" : "Star on GitHub"}
        className="flex cursor-pointer items-center gap-1.5 font-mono text-sm text-white/75 transition-colors hover:text-white disabled:opacity-50"
      >
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className={`h-4 w-4 ${starred ? "fill-current" : "fill-none"} stroke-current`}
          strokeWidth="1.3"
        >
          <path d="M8 1.5l2 4.1 4.5.6-3.3 3.2.8 4.5L8 11.8l-4 2.1.8-4.5L1.5 6.2l4.5-.6L8 1.5z" strokeLinejoin="round" />
        </svg>
        <span className="sr-only">{starred ? "Starred" : "Star"}:</span>
        {stars}
      </button>
      {error ? (
        <span
          data-testid="star-error"
          role="alert"
          className="absolute right-0 top-full z-10 mt-2 flex w-64 flex-col items-start gap-2 rounded-lg border border-error bg-background px-3 py-2 text-left font-sans text-xs text-error shadow-lg"
        >
          {error.text}
          {error.url ? (
            // Botón, no URL en el texto: en móvil una dirección escrita no se
            // puede seguir sin copiarla a mano.
            <a
              href={error.url}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="star-error-fix"
              className="rounded-md bg-error px-2.5 py-1 font-medium text-background transition-opacity hover:opacity-90"
            >
              {error.label ?? "Fix on GitHub"} ↗
            </a>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
