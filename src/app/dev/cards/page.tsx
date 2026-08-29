/**
 * Página de demo en local: fichas de ejemplo para comprobar a ojo el determinismo
 * y la coherencia visual entre lenguajes. No forma parte del producto navegable:
 * en producción devuelve 404 (ver `notFound()` más abajo).
 */

import { notFound } from "next/navigation";

const FIXTURES = [
  { repoId: "1296269", name: "hello-world", description: "My first repository on GitHub!", language: "TypeScript" },
  { repoId: "83222441", name: "satori", description: "Enlightened library to convert HTML and CSS to SVG.", language: "TypeScript" },
  { repoId: "4164482", name: "django", description: "The Web framework for perfectionists with deadlines.", language: "Python" },
  { repoId: "724712", name: "rails", description: "Ruby on Rails.", language: "Ruby" },
  { repoId: "44838949", name: "swift", description: "The Swift Programming Language.", language: "Swift" },
  { repoId: "27193779", name: "ripgrep", description: "ripgrep recursively searches directories for a regex pattern while respecting your gitignore.", language: "Rust" },
  { repoId: "31792824", name: "flutter", description: "Flutter makes it easy and fast to build beautiful apps for mobile and beyond.", language: "Dart" },
  { repoId: "20580498", name: "kubernetes", description: "Production-Grade Container Scheduling and Management. Una descripción deliberadamente larga para comprobar que el truncado a 140 caracteres funciona como debe en la ficha.", language: "Go" },
  { repoId: "sin-lenguaje", name: "notas-sueltas", description: "Un repo sin lenguaje dominante, para ver el color de reserva.", language: null },
] as const;

function cardUrl(fixture: (typeof FIXTURES)[number]): string {
  const params = new URLSearchParams({ repoId: fixture.repoId, name: fixture.name, description: fixture.description });
  if (fixture.language) params.set("language", fixture.language);
  return `/api/og?${params.toString()}`;
}

export default function DevCardsPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-mono text-2xl font-bold">Demo de fichas</h1>
      <p className="mt-2 text-content-secondary">
        Mismo repo → mismo fondo en cada recarga. La paleta sale del color Linguist del lenguaje.
      </p>
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {FIXTURES.map((fixture) => (
          <figure key={fixture.repoId} data-testid="repo-card">
            {/* eslint-disable-next-line @next/next/no-img-element -- imagen generada por el propio endpoint OG */}
            <img
              src={cardUrl(fixture)}
              alt={`Ficha de ${fixture.name}`}
              width={1200}
              height={630}
              className="w-full rounded-2xl border border-edge"
            />
            <figcaption className="mt-2 font-mono text-sm text-content-secondary">
              {fixture.name} · {fixture.language ?? "sin lenguaje"}
            </figcaption>
          </figure>
        ))}
      </div>
    </main>
  );
}
