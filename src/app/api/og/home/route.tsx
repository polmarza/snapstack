import { ImageResponse } from "next/og";
import { cardBackground, languageColor, type CardBackground } from "@/lib/card-seed";

/**
 * Portada og:image de la home: el hero de la landing, congelado. Columnas de
 * mini-fichas procedurales (mismo motor que las tarjetas reales) con desfases
 * verticales que imitan el deslizamiento a media marcha, velo oscuro y la marca
 * centrada. Semillas fijas → imagen determinista → cacheable por CDN.
 */

const REPOS: Array<[string, string]> = [
  ["side-project", "TypeScript"], ["the-good-one", "Rust"], ["tiny-parser", "Python"],
  ["dotfiles", "Shell"], ["weekend-hack", "Go"], ["not-a-todo-app", "Ruby"],
  ["ship-it", "Swift"], ["over-engineered", "Kotlin"], ["cursed-regex", "JavaScript"],
  ["pixel-pusher", "Dart"], ["yak-shaver", "Haskell"], ["big-refactor", "Elixir"],
  ["cache-money", "C++"], ["null-checked", "Zig"], ["merge-conflict", "Lua"],
];

const COLUMN_OFFSETS = [-46, -104, -18, -82, -60];

function MiniCard({ name, language }: { name: string; language: string }) {
  const bg: CardBackground = cardBackground(name, language);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: 216,
        height: 132,
        borderRadius: 14,
        padding: 14,
        backgroundImage: `linear-gradient(${bg.angle}deg, ${bg.gradientFrom}, ${bg.gradientTo})`,
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ width: 8, height: 8, borderRadius: 9999, backgroundColor: languageColor(language) }} />
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{language}</span>
      </div>
      <span style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>{name}</span>
    </div>
  );
}

export function GET() {
  const columns = Array.from({ length: 5 }, (_, col) =>
    Array.from({ length: 6 }, (_, row) => REPOS[(col * 3 + row) % REPOS.length]),
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "#0b0e14",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        {/* Las columnas, con desfases que imitan la deriva del hero. */}
        <div style={{ position: "absolute", left: -30, top: 0, display: "flex", gap: 16, opacity: 0.55 }}>
          {columns.map((column, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: COLUMN_OFFSETS[i] }}>
              {column.map(([name, language], j) => (
                <MiniCard key={`${i}-${j}`} name={name} language={language} />
              ))}
            </div>
          ))}
        </div>

        {/* Velo y marca, como en el hero. Satori no soporta el atajo `inset`:
            los cuatro offsets van explícitos o el velo colapsa a su contenido. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "1200px",
            height: "630px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundImage:
              "linear-gradient(180deg, rgba(11,14,20,0.6), rgba(11,14,20,0.45), rgba(11,14,20,0.85))",
          }}
        >
          <span style={{ fontSize: 118, fontWeight: 700, color: "#ffffff", letterSpacing: -3 }}>
            snapstack
          </span>
          <span style={{ fontSize: 34, color: "rgba(255,255,255,0.75)", marginTop: 6 }}>
            Your best work, worth showing off.
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        // Determinista: la CDN puede cachearla sin miedo.
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
