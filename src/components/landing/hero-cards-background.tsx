import { cardBackground, languageColor } from "@/lib/card-seed";
import type { FeedRepo } from "@/lib/db/feed-page";
import { CardBackgroundLayer } from "@/components/feed/card-background";

/**
 * Fondo del hero: las tarjetas reales del feed, en columnas que derivan en
 * vertical con direcciones alternas (sube, baja, sube…). Puro CSS: cada columna
 * lleva su contenido duplicado y un keyframe que recorre la mitad, así el bucle
 * no tiene costura. Decorativo: aria-hidden, sin eventos, y quieto si el
 * usuario pide menos movimiento.
 */

const COLUMN_DURATIONS = ["46s", "58s", "40s", "62s", "50s"];

function MiniCard({ repo }: { repo: FeedRepo }) {
  const background = cardBackground(String(repo.github_repo_id), repo.primary_language);
  const name = repo.full_name.split("/").pop() ?? repo.full_name;
  return (
    <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-xl border border-white/5">
      <CardBackgroundLayer background={background} />
      <div className="absolute left-3 top-3 flex items-center gap-1.5">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: languageColor(repo.primary_language) }}
        />
        <span className="font-mono text-[10px] text-white/60">{repo.primary_language ?? ""}</span>
      </div>
      <span className="absolute bottom-3 left-3 right-3 truncate font-mono text-xs font-bold text-white/80">
        {name}
      </span>
    </div>
  );
}

export function HeroCardsBackground({ repos }: { repos: FeedRepo[] }) {
  if (repos.length === 0) return null;

  // Reparte los repos en 5 columnas de 4, ciclando si hay menos que huecos.
  const columns = Array.from({ length: 5 }, (_, col) =>
    Array.from({ length: 4 }, (_, row) => repos[(col * 4 + row) % repos.length]),
  );

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 flex justify-center gap-4 opacity-30">
        {columns.map((column, i) => (
          <div
            key={i}
            className={`w-44 shrink-0 sm:w-52 ${i >= 3 ? "hidden lg:block" : ""} ${i === 2 ? "" : ""}`}
          >
            <div
              className={`flex flex-col gap-4 ${i % 2 === 0 ? "landing-column" : "landing-column landing-column-reverse"}`}
              style={{ "--drift-duration": COLUMN_DURATIONS[i] } as React.CSSProperties}
            >
              {/* Contenido duplicado para el bucle sin costura. */}
              {[...column, ...column].map((repo, j) => (
                <MiniCard key={`${repo.id}-${j}`} repo={repo} />
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* Velo para que el texto del hero mande sobre las tarjetas. */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/55 to-background" />
    </div>
  );
}
