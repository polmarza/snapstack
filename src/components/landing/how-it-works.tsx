import { MousePointer2 } from "lucide-react";
import { cardBackground, languageColor } from "@/lib/card-seed";
import { CardBackgroundLayer } from "@/components/feed/card-background";

/**
 * Cómo funciona, en tres pasos con su gráfico: el botón real de entrar con un
 * cursor a punto de pulsarlo, la selección con su contador de pastillas (el
 * mismo que usa la app de verdad), y la ficha resultante con sus estrellas —
 * dibujada por el mismo motor procedural, no una captura.
 */

function GithubMark({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={`fill-current ${className}`}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

/** Paso 1: el botón real de la app, con el cursor a punto de pulsar. */
function SignInGraphic() {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div className="flex h-11 items-center gap-2 rounded-lg bg-white px-6 text-base font-medium text-background shadow-lg shadow-black/40">
        <GithubMark />
        Sign in
      </div>
      <MousePointer2
        size={22}
        aria-hidden
        className="absolute translate-x-14 translate-y-6 fill-content text-content"
      />
    </div>
  );
}

/** Paso 2: dos repos (uno elegido, otro no) y el contador de pastillas real. */
function SelectionGraphic() {
  const rows = [
    { name: "the-good-one", desc: "The one you'd show in an interview.", checked: true },
    { name: "dotfiles", desc: "We all have one. It can rest.", checked: false },
  ];
  return (
    <div className="flex w-full flex-col gap-2">
      {rows.map((row) => (
        <div
          key={row.name}
          className={`flex flex-col gap-0.5 rounded-lg border px-3 py-2 ${row.checked ? "border-primary" : "border-edge"}`}
        >
          <div className="flex items-center gap-2.5">
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded font-mono text-[10px] ${row.checked ? "bg-primary text-background" : "border border-edge"}`}
            >
              {row.checked ? "✓" : ""}
            </span>
            <span className="font-mono text-xs font-bold">{row.name}</span>
          </div>
          <span className="pl-[26px] text-xs text-content-secondary">{row.desc}</span>
        </div>
      ))}
      <div className="mt-1 flex items-center justify-end gap-2">
        <span className="font-mono text-[11px] text-content-secondary">1 / 5</span>
        <span className="flex gap-1">
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} className={`h-1.5 w-4 rounded-full ${i < 1 ? "bg-primary" : "bg-edge"}`} />
          ))}
        </span>
      </div>
    </div>
  );
}

/** Paso 3: la ficha resultante, con sus estrellas — el motor procedural real. */
function CardGraphic() {
  const background = cardBackground("the-good-one", "Rust");
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-edge">
      <CardBackgroundLayer background={background} />
      <div className="absolute left-3 right-3 top-3 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: languageColor("Rust") }} />
          <span className="font-mono text-[10px] text-white/70">Rust</span>
        </span>
        <span className="flex items-center gap-1 font-mono text-[11px] text-white/75">
          <svg aria-hidden viewBox="0 0 16 16" className="h-3 w-3 fill-none stroke-current" strokeWidth="1.3">
            <path d="M8 1.5l2 4.1 4.5.6-3.3 3.2.8 4.5L8 11.8l-4 2.1.8-4.5L1.5 6.2l4.5-.6L8 1.5z" strokeLinejoin="round" />
          </svg>
          128
        </span>
      </div>
      <div className="absolute bottom-3 left-3 right-3 flex flex-col">
        <span className="font-mono text-sm font-bold text-white">the-good-one</span>
        <span className="truncate text-xs text-white/60">A tiny parser that grew feelings.</span>
      </div>
    </div>
  );
}

const STEPS = [
  {
    title: "Sign in with GitHub",
    text: "One click. Read-only: snapstack never writes to your repos.",
    graphic: <SignInGraphic />,
  },
  {
    title: "Pick your best five",
    text: "Not everything — just the work that defines you. Curation is the point.",
    graphic: <SelectionGraphic />,
  },
  {
    title: "Get your cards, join the feed",
    text: "Every repo becomes a visual card, generated from its own identity. Devs discover you by scrolling.",
    graphic: <CardGraphic />,
  },
];

export function HowItWorks() {
  return (
    <section id="start" data-testid="landing-start" className="mx-auto max-w-5xl scroll-mt-20 px-4 py-20 sm:px-6">
      <h2 className="text-center font-mono text-3xl font-bold">Getting started</h2>
      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <div key={step.title} className="flex flex-col rounded-2xl border border-edge bg-surface p-6">
            <div className="flex h-40 items-center">{step.graphic}</div>
            <span className="mt-6 font-mono text-xs text-primary">0{i + 1}</span>
            <h3 className="mt-1 font-mono text-lg font-bold">{step.title}</h3>
            <p className="mt-2 text-lg text-content-secondary">{step.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
