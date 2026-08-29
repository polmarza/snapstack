import { ImageResponse } from "next/og";
import { buildCardInput, type CardInput } from "@/lib/card-seed";

export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;

function Card({ input }: { input: CardInput }) {
  const { name, description, language, languageColor, background } = input;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 64,
        backgroundImage: `linear-gradient(${background.angle}deg, ${background.gradientFrom}, ${background.gradientTo})`,
        fontFamily: "sans-serif",
      }}
    >
      {background.blobs.map((blob, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${blob.cx - blob.r}%`,
            top: `${blob.cy - blob.r}%`,
            width: `${blob.r * 2}%`,
            height: `${blob.r * 2}%`,
            backgroundImage: `radial-gradient(circle, ${blob.color}, transparent 70%)`,
            opacity: blob.opacity,
          }}
        />
      ))}

      {/* Sin lenguaje no se pinta el chip: en una imagen que se comparte, un
          guion suelto es ruido. El hueco se mantiene para no mover el texto. */}
      {language ? (
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 9999,
              backgroundColor: languageColor,
            }}
          />
          <span style={{ fontSize: 30, color: "rgba(255,255,255,0.75)" }}>{language}</span>
        </div>
      ) : (
        <div style={{ display: "flex" }} />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <span style={{ fontSize: 72, fontWeight: 700, color: "#FFFFFF", lineHeight: 1.1 }}>
          {name}
        </span>
        {description ? (
          <span style={{ fontSize: 32, color: "rgba(255,255,255,0.72)", lineHeight: 1.35 }}>
            {description}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function GET(request: Request) {
  const input = buildCardInput(new URL(request.url).searchParams);

  return new ImageResponse(<Card input={input} />, {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    headers: {
      // El fondo es determinista por URL: la CDN puede cachear sin miedo.
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
