import type { CardBackground } from "@/lib/card-seed";

/**
 * Fondo procedural de una ficha pintado en CSS a partir de la misma data
 * determinista que usa /api/og: mismo repo → mismo fondo, aquí y en la imagen.
 */
export function CardBackgroundLayer({ background }: { background: CardBackground }) {
  return (
    <div
      aria-hidden
      // Decoración pura: sin esto, una mancha que cae sobre el pie de la
      // tarjeta intercepta los clicks del enlace al repo.
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage: `linear-gradient(${background.angle}deg, ${background.gradientFrom}, ${background.gradientTo})`,
      }}
    >
      {background.blobs.map((blob, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${blob.cx - blob.r}%`,
            top: `${blob.cy - blob.r}%`,
            width: `${blob.r * 2}%`,
            height: `${blob.r * 2}%`,
            backgroundImage: `radial-gradient(circle, ${blob.color}, transparent 70%)`,
            opacity: blob.opacity,
          }}
        />
      ))}
    </div>
  );
}
