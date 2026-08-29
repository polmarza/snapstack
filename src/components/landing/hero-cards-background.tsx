import { cardBackground, languageColor } from "@/lib/card-seed";
import type { FeedRepo } from "@/lib/db/feed-page";
import { CardBackgroundLayer } from "@/components/feed/card-background";

/**
 * Fondo del hero: las tarjetas reales del feed, en columnas de borde a borde
 * que derivan en vertical con direcciones alternas.
 *
 * El bucle es matemáticamente exacto y por eso no tiene tirón: el hueco entre
 * tarjetas va como `margin-bottom` de cada una (no como `gap` del contenedor),
 * de modo que la altura total es N·(tarjeta+hueco) y el keyframe a -50% cae
 * justo donde empieza la segunda copia. Con `gap`, la mitad quedaba descuadrada
 * por medio hueco y el reinicio se notaba. Cada copia lleva además tarjetas de
 * sobra para cubrir el alto del hero: sin huecos al arrancar en las columnas
 * que van en reversa.
 */

const COLUMN_DURATIONS = ["52s", "64s", "46s", "70s", "58s"];
const CARDS_PER_COPY = 7;

function MiniCard({ repo }: { repo: FeedRepo }) {
  const background = cardBackground(String(repo.github_repo_id), repo.primary_language);
  const name = repo.full_name.split("/").pop() ?? repo.full_name;
  return (
    <div className="relative mb-4 aspect-[16/10] w-full shrink-0 overflow-hidden rounded-xl border border-white/5 text-left">
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

  const columns = Array.from({ length: 5 }, (_, col) =>
    Array.from({ length: CARDS_PER_COPY }, (_, row) => repos[(col * 3 + row) % repos.length]),
  );

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Sobresale un poco por los lados para que no se vea el borde de la retícula. */}
      <div className="absolute -inset-x-4 inset-y-0 flex gap-4 opacity-30">
        {columns.map((column, i) => (
          <div key={i} className={`min-w-0 flex-1 ${i >= 3 ? "hidden lg:block" : ""}`}>
            <div
              className={`flex flex-col ${i % 2 === 0 ? "landing-column" : "landing-column landing-column-reverse"}`}
              style={{ "--drift-duration": COLUMN_DURATIONS[i] } as React.CSSProperties}
            >
              {/* Dos copias idénticas: el keyframe a -50% empalma sin costura. */}
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
