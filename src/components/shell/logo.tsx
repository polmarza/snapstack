"use client";

import { useId } from "react";

/**
 * Logo de snapstack: el cuadrado verde del favicon con las capas **recortadas**
 * — el trazo del icono es un agujero real en el rectángulo (máscara SVG), así
 * que por la silueta se ve lo que haya detrás. `useId` evita colisiones de ids
 * cuando el logo aparece más de una vez en la página.
 */
export function Logo({ size = 26 }: { size?: number }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className="shrink-0">
      <mask id={id}>
        <rect width="32" height="32" rx="7" fill="white" />
        <g
          transform="translate(4.5, 4.5) scale(0.958)"
          fill="none"
          stroke="black"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
          <path d="M22 17.65 12.83 21.8a2 2 0 0 1-1.66 0L2 17.65" />
          <path d="M22 12.65 12.83 16.8a2 2 0 0 1-1.66 0L2 12.65" />
        </g>
      </mask>
      <rect width="32" height="32" rx="7" fill="#34d399" mask={`url(#${id})`} />
    </svg>
  );
}
