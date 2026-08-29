"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { AuthControls } from "@/components/auth/auth-controls";
import { Logo } from "@/components/shell/logo";

/**
 * Navegación de la landing. Tres piezas:
 *
 * - **En el hero** (desktop): centrada, sin fondo, solo los enlaces — el hero
 *   ya trae su propio botón de entrar.
 * - **Al pasar el hero**: fija arriba con el fondo de la app; en desktop, marca
 *   a la izquierda, enlaces y botón de entrar a la derecha.
 * - **En móvil**: las cinco secciones no caben junto a la marca y el botón
 *   (medido: faltaban ~100 px incluso acortando etiquetas), así que la barra
 *   lleva un burger en color de acento con la palabra, y el menú se despliega
 *   a pantalla completa sobre el verde de marca, con la entrada al final.
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
          className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition-colors hover:bg-white/10"
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
  const [abierto, setAbierto] = useState(false);

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

  // Con el menú abierto: Esc cierra, y el fondo no hace scroll por detrás.
  useEffect(() => {
    if (!abierto) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAbierto(false);
    };
    document.addEventListener("keydown", onKey);
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previo;
    };
  }, [abierto]);

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
          {/* Móvil: burger en color de acento + la palabra. */}
          <button
            type="button"
            data-testid="landing-nav-burger"
            aria-label="Open menu"
            aria-expanded={abierto}
            onClick={() => setAbierto(true)}
            className="flex shrink-0 items-center gap-2.5 font-mono text-lg font-bold lowercase sm:hidden"
          >
            <Menu size={24} strokeWidth={2} aria-hidden className="text-primary" />
            snapstack
          </button>

          {/* Desktop: marca, divisoria, enlaces y entrada. */}
          <a
            href="#top"
            className="hidden shrink-0 items-center gap-2.5 font-mono text-lg font-bold lowercase sm:flex"
          >
            <Logo size={24} />
            snapstack
          </a>
          <span aria-hidden className="hidden h-6 w-px shrink-0 bg-edge sm:block" />
          <Enlaces className="hidden text-content-secondary sm:flex" />
          <div className="ml-auto hidden shrink-0 sm:block">
            <AuthControls />
          </div>
        </div>
      </div>

      {/* Menú de móvil, a pantalla completa sobre el verde de marca. */}
      {abierto ? (
        <div
          data-testid="landing-nav-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="fixed inset-0 z-50 flex flex-col bg-primary px-6 py-3 text-left text-background sm:hidden"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-lg font-bold lowercase">snapstack</span>
            <button
              type="button"
              data-testid="landing-nav-close"
              aria-label="Close menu"
              onClick={() => setAbierto(false)}
              className="rounded-lg p-1.5 transition-opacity hover:opacity-70"
            >
              <X size={24} strokeWidth={2} aria-hidden />
            </button>
          </div>

          {/* Centrado explícito: sin esto lo heredaría del hero, que es donde
              vive este componente — una dependencia frágil. */}
          <nav aria-label="Sections" className="mt-10 flex flex-col text-center">
            {SECCIONES.map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                data-testid={`landing-nav-mobile-${id}`}
                onClick={() => setAbierto(false)}
                className="py-3 font-mono text-2xl font-bold transition-opacity hover:opacity-70"
              >
                {label}
              </a>
            ))}
          </nav>

          {/* La entrada, al final: es lo último que se lee antes de decidir. */}
          <div className="mt-auto flex justify-center pb-6">
            <AuthControls size="lg" tone="onPrimary" />
          </div>
        </div>
      ) : null}
    </>
  );
}
