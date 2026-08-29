"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, PanelLeftClose, PanelLeftOpen } from "lucide-react";
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
 *   (medido: faltaban ~100 px incluso acortando etiquetas), así que se
 *   despliegan. El disparador no es un burger sino el icono de **abrir panel
 *   lateral** — el de cualquier editor de código, que es el lenguaje de quien
 *   nos lee. Al abrir, la barra se queda donde está y el panel la envuelve en
 *   el verde de marca: mismo sitio para el icono, la marca y la entrada, solo
 *   cambian los colores, y debajo aparecen las secciones con su flecha.
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
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-200 ${
          abierto
            ? "border-b border-transparent bg-primary text-background"
            : "border-b border-edge bg-background/95 backdrop-blur"
        } ${fija ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-full opacity-0"}`}
      >
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          {/* Móvil: el icono de panel lateral y la marca. Al abrir no se mueven
              de sitio — solo cambia el color y el icono pasa a "contraer". */}
          <button
            type="button"
            data-testid="landing-nav-burger"
            aria-label={abierto ? "Close menu" : "Open menu"}
            aria-expanded={abierto}
            onClick={() => setAbierto((v) => !v)}
            className="flex shrink-0 items-center gap-2.5 font-mono text-lg font-bold lowercase sm:hidden"
          >
            <span className="transition-transform duration-200 active:scale-90">
              {abierto ? (
                <PanelLeftClose size={24} strokeWidth={2} aria-hidden />
              ) : (
                <PanelLeftOpen size={24} strokeWidth={2} aria-hidden />
              )}
            </span>
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
          {/* La entrada, arriba a la derecha siempre: sobre el verde cambia a
              fondo oscuro para seguir leyéndose. */}
          <div className="ml-auto shrink-0">
            <AuthControls tone={abierto ? "onPrimary" : "onDark"} />
          </div>
        </div>
      </div>

      {/* El panel desplegado: ocupa la pantalla bajo la barra, que se queda en
          su sitio. Las flechas caen bajo el icono y las etiquetas bajo la
          marca — la misma rejilla, alineada a la izquierda. */}
      {abierto ? (
        <div
          data-testid="landing-nav-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          // Cubre la pantalla entera y deja hueco arriba para la barra, que
          // queda por encima (z mayor) y en el mismo verde: sin costura.
          className="fixed inset-0 z-40 bg-primary px-4 pb-8 pt-20 text-left text-background sm:hidden"
        >
          <nav aria-label="Sections" className="flex flex-col">
            {SECCIONES.map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                data-testid={`landing-nav-mobile-${id}`}
                onClick={() => setAbierto(false)}
                className="flex items-center gap-2.5 py-3 font-mono text-lg font-bold transition-opacity active:opacity-60"
              >
                <span className="flex w-6 shrink-0 justify-center">
                  <ArrowRight size={18} strokeWidth={2.25} aria-hidden />
                </span>
                {label}
              </a>
            ))}
          </nav>
        </div>
      ) : null}
    </>
  );
}
