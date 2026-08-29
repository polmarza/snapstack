"use client";

import { useEffect, useRef, useState } from "react";
import { AuthControls } from "@/components/auth/auth-controls";
import { Logo } from "@/components/shell/logo";

/**
 * Navegación de la landing. Dos momentos:
 *
 * - **En el hero**: centrada, sin fondo, sobre las tarjetas que derivan —
 *   solo los enlaces, porque el hero ya trae su propio botón de entrar.
 * - **Al pasar el hero**: fija arriba, con el fondo de la app, alineada a la
 *   izquierda con la marca, y el botón de entrar a la derecha — ahí ya no es
 *   redundante, es la única puerta a la vista.
 *
 * Los nombres son cortos a propósito: no repiten el titular de cada sección,
 * que es largo por diseño.
 */

const SECCIONES = [
  { id: "why", label: "Why" },
  { id: "features", label: "Features" },
  { id: "start", label: "Get started" },
  { id: "stack", label: "Stack" },
  { id: "faq", label: "FAQ" },
];

function Enlaces({ className = "" }: { className?: string }) {
  return (
    <nav aria-label="Sections" className={`flex items-center gap-1 ${className}`}>
      {SECCIONES.map(({ id, label }) => (
        <a
          key={id}
          href={`#${id}`}
          data-testid={`landing-nav-${id}`}
          className="rounded-lg px-3 py-1.5 text-sm transition-colors hover:bg-white/10"
        >
          {label}
        </a>
      ))}
    </nav>
  );
}

export function LandingNav() {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [fija, setFija] = useState(false);

  useEffect(() => {
    const hero = anchorRef.current?.closest("section");
    if (!hero) return;
    // La barra fija entra cuando el hero termina de pasar: antes sería
    // redundante con el botón de entrar que el hero ya tiene a la vista.
    const observer = new IntersectionObserver(
      ([entry]) => setFija(!entry.isIntersecting),
      { rootMargin: "-72px 0px 0px 0px", threshold: 0 },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* En el hero: absoluta, para que aparecer y desaparecer no mueva nada. */}
      <div
        ref={anchorRef}
        data-testid="landing-nav-hero"
        className="absolute inset-x-0 top-5 z-20 hidden justify-center text-white/80 sm:flex"
      >
        <Enlaces />
      </div>

      <div
        data-testid="landing-nav-sticky"
        data-visible={fija}
        className={`fixed inset-x-0 top-0 z-40 border-b border-edge bg-background/95 backdrop-blur transition-all duration-200 ${
          fija ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-full opacity-0"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <a href="#top" className="flex shrink-0 items-center gap-2.5 font-mono text-lg font-bold lowercase">
            <Logo size={24} />
            snapstack
          </a>
          <span aria-hidden className="hidden h-6 w-px shrink-0 bg-edge sm:block" />
          <Enlaces className="hidden text-content-secondary sm:flex" />
          <div className="ml-auto shrink-0">
            <AuthControls />
          </div>
        </div>
      </div>
    </>
  );
}
