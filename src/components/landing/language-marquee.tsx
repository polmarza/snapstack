import { languageColor } from "@/lib/card-seed";

/**
 * Tira horizontal con los lenguajes de GitHub en bucle. Texto apagado y el
 * punto en el color oficial de Linguist: la marca de color de las fichas,
 * sin que la tira grite. Decorativa: aria-hidden y quieta con reduced-motion.
 */

const LANGUAGES = [
  "TypeScript", "Python", "Rust", "Go", "JavaScript", "Ruby", "Swift",
  "Kotlin", "Java", "C++", "C", "C#", "PHP", "Dart", "Elixir", "Haskell",
  "Zig", "Lua", "Shell", "Scala", "Clojure", "OCaml", "HTML", "CSS",
];

export function LanguageMarquee() {
  const items = [...LANGUAGES, ...LANGUAGES]; // duplicado para el bucle sin costura
  return (
    <div
      aria-hidden
      className="relative overflow-hidden border-y border-edge py-4 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
    >
      {/* El hueco va como margen de cada item (no como gap): así -50% cae justo
          donde empieza la segunda copia y el bucle no tiene tirón. */}
      <div className="landing-marquee flex w-max items-center">
        {items.map((language, i) => (
          <span key={`${language}-${i}`} className="mr-8 flex shrink-0 items-center gap-2 font-mono text-sm text-content-secondary">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: languageColor(language) }} />
            {language}
          </span>
        ))}
      </div>
    </div>
  );
}
