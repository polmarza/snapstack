"use client";

import { useRef } from "react";
import { X } from "lucide-react";

/**
 * Explicación de los dos alcances de instalación de la GitHub App (C-08), en
 * un modal: en el banner el texto quedaba diminuto y es justo la decisión que
 * el usuario tiene que tomar en la pantalla siguiente, la de GitHub.
 *
 * `<dialog>` nativo: modal accesible, Esc y foco atrapado sin librerías.
 */

/** Repo cubierto por la instalación. */
function CoveredRepo({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect width="34" height="26" rx="5" fill="var(--color-primary)" opacity="0.18" />
      <rect
        width="34"
        height="26"
        rx="5"
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="1.5"
      />
      <rect x="7" y="8" width="20" height="2.5" rx="1.25" fill="var(--color-primary)" opacity="0.9" />
      <rect x="7" y="14" width="13" height="2.5" rx="1.25" fill="var(--color-primary)" opacity="0.55" />
    </g>
  );
}

/** Repo fuera de la instalación: apagado y con borde discontinuo. */
function UncoveredRepo({ x, y, plus = false }: { x: number; y: number; plus?: boolean }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect
        width="34"
        height="26"
        rx="5"
        fill="none"
        stroke="var(--color-content-secondary)"
        strokeWidth="1.5"
        strokeDasharray="3 3"
        opacity="0.7"
      />
      {plus ? (
        <g stroke="var(--color-content-secondary)" strokeWidth="1.8" strokeLinecap="round" opacity="0.8">
          <line x1="17" y1="8" x2="17" y2="18" />
          <line x1="12" y1="13" x2="22" y2="13" />
        </g>
      ) : (
        <>
          <rect x="7" y="8" width="20" height="2.5" rx="1.25" fill="var(--color-content-secondary)" opacity="0.5" />
          <rect x="7" y="14" width="13" height="2.5" rx="1.25" fill="var(--color-content-secondary)" opacity="0.35" />
        </>
      )}
    </g>
  );
}

/** El área que la App cubre: marco verde etiquetado. */
function CoverageFrame({ width, height }: { width: number; height: number }) {
  return (
    <rect
      x="1"
      y="1"
      width={width - 2}
      height={height - 2}
      rx="10"
      fill="var(--color-primary)"
      fillOpacity="0.05"
      stroke="var(--color-primary)"
      strokeWidth="1.5"
      strokeOpacity="0.5"
    />
  );
}

/** Todos dentro, incluido el que llegue mañana. */
function AllReposArt() {
  return (
    <svg viewBox="0 0 220 104" className="h-auto w-full" role="img" aria-label="All repositories: current and future repos covered">
      <CoverageFrame width={220} height={104} />
      <CoveredRepo x={22} y={20} />
      <CoveredRepo x={70} y={20} />
      <CoveredRepo x={118} y={20} />
      <CoveredRepo x={166} y={20} />
      <CoveredRepo x={22} y={58} />
      <CoveredRepo x={70} y={58} />
      <g transform="translate(118, 58)">
        <rect width="34" height="26" rx="5" fill="var(--color-primary)" opacity="0.1" />
        <rect width="34" height="26" rx="5" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeDasharray="3 3" />
        <g stroke="var(--color-primary)" strokeWidth="1.8" strokeLinecap="round">
          <line x1="17" y1="8" x2="17" y2="18" />
          <line x1="12" y1="13" x2="22" y2="13" />
        </g>
      </g>
      <CoveredRepo x={166} y={58} />
    </svg>
  );
}

/** Solo los marcados; el nuevo se queda fuera. */
function SelectReposArt() {
  return (
    <svg viewBox="0 0 220 104" className="h-auto w-full" role="img" aria-label="Only select repositories: repos added later stay outside">
      <g>
        <rect
          x="1"
          y="1"
          width="140"
          height="102"
          rx="10"
          fill="var(--color-primary)"
          fillOpacity="0.05"
          stroke="var(--color-primary)"
          strokeWidth="1.5"
          strokeOpacity="0.5"
        />
      </g>
      <CoveredRepo x={22} y={20} />
      <CoveredRepo x={70} y={20} />
      <CoveredRepo x={22} y={58} />
      <CoveredRepo x={70} y={58} />
      <UncoveredRepo x={160} y={20} />
      <UncoveredRepo x={160} y={58} plus />
    </svg>
  );
}

function ScopeCard({
  art,
  title,
  recommended = false,
  children,
}: {
  art: React.ReactNode;
  title: string;
  recommended?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border p-4 ${
        recommended ? "border-primary/50 bg-primary/5" : "border-edge"
      }`}
    >
      {art}
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-mono text-base font-bold">{title}</h3>
        {recommended ? (
          <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-background">
            Recommended
          </span>
        ) : null}
      </div>
      <p className="text-sm leading-relaxed text-content-secondary">{children}</p>
    </div>
  );
}

export function InstallScopeDialog() {
  const ref = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        data-testid="install-scope-open"
        onClick={() => ref.current?.showModal()}
        className="rounded-lg border border-edge px-4 py-2 text-sm font-medium text-content-secondary transition-colors hover:text-content"
      >
        More info
      </button>

      <dialog
        ref={ref}
        data-testid="install-scope-dialog"
        // El backdrop cierra: click fuera del contenido (el propio <dialog> es
        // el fondo; el <div> interior detiene la propagación).
        onClick={(event) => {
          if (event.target === ref.current) ref.current?.close();
        }}
        className="m-auto w-[min(46rem,92vw)] rounded-2xl border border-edge bg-background p-0 text-content backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-mono text-xl font-bold">Which repos should the app cover?</h2>
              <p className="mt-1 text-sm text-content-secondary">
                GitHub will ask you this on the next screen. Either way, snapstack only ever
                reads — it never writes to your code.
              </p>
            </div>
            <button
              type="button"
              data-testid="install-scope-close"
              onClick={() => ref.current?.close()}
              aria-label="Close"
              className="shrink-0 rounded-lg p-1.5 text-content-secondary transition-colors hover:text-content"
            >
              <X size={18} strokeWidth={1.75} aria-hidden />
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ScopeCard art={<AllReposArt />} title="All repositories" recommended>
              Every public repo you have, plus the ones you create later — covered
              automatically. You do this once and never think about it again.
            </ScopeCard>
            <ScopeCard art={<SelectReposArt />} title="Only select repositories">
              Only the repos you tick right now. Stricter, but each time you add a new repo to
              snapstack you&apos;ll have to come back here and include it too.
            </ScopeCard>
          </div>

          <p className="mt-6 text-sm leading-relaxed text-content-secondary">
            What the app does with that access: keeps your stars and repo details in sync, and
            notifies the devs subscribed to your repos when you push. Nothing else.
          </p>
        </div>
      </dialog>
    </>
  );
}
