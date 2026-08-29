"use client";

import { useState, useTransition } from "react";
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
 * Optimista con el contador; si falta autorización, redirige al OAuth de la
 * App y vuelve aquí. Sin sesión, el detalle pinta el contador pasivo.
 */
export function StarButton({ fullName, initialStars, initialStarred }: StarButtonProps) {
  const { isSignedIn } = useAuth();
  const pathname = usePathname();
  const [starred, setStarred] = useState(initialStarred ?? false);
  const [stars, setStars] = useState(initialStars);
  const [pending, startTransition] = useTransition();

  if (!isSignedIn) return null;

  const toggle = () => {
    const next = !starred;
    setStarred(next);
    setStars((s) => s + (next ? 1 : -1));
    startTransition(async () => {
      const result = await setStarAction(fullName, next);
      if (result.needsConnect) {
        window.location.assign(`/api/github/connect?from=${encodeURIComponent(pathname)}`);
        return;
      }
      if (!result.ok) {
        setStarred(!next);
        setStars((s) => s + (next ? -1 : 1));
      }
    });
  };

  return (
    <button
      type="button"
      data-testid="star-button"
      data-starred={starred}
      onClick={toggle}
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
  );
}
