import {
  siClerk,
  siGithub,
  siNextdotjs,
  siPostgresql,
  siReact,
  siSupabase,
  siTailwindcss,
  siTypescript,
  siVercel,
  siVitest,
} from "simple-icons";

/**
 * Cómo está construido snapstack. La landing habla a devs: enseñar el stack
 * (y que el código es público desde el primer commit) es información útil,
 * no decoración.
 *
 * Los iconos salen de `simple-icons` (ya instalada para las redes del perfil):
 * paths oficiales, sin descargar assets de terceros ni servirlos nosotros. Se
 * pintan monocromos porque varias marcas son negras y desaparecerían sobre el
 * fondo oscuro.
 */

const STACK = [
  { icon: siNextdotjs, name: "Next.js", role: "App Router, server-rendered" },
  { icon: siReact, name: "React", role: "the interface" },
  { icon: siTypescript, name: "TypeScript", role: "strict, no any" },
  { icon: siTailwindcss, name: "Tailwind CSS", role: "styling" },
  { icon: siClerk, name: "Clerk", role: "sign in with GitHub" },
  { icon: siSupabase, name: "Supabase", role: "database and APIs" },
  { icon: siPostgresql, name: "PostgreSQL", role: "the data, with RLS" },
  { icon: siVercel, name: "Vercel", role: "hosting, and the card renderer" },
  { icon: siGithub, name: "GitHub App", role: "webhooks and stars" },
  { icon: siVitest, name: "Vitest", role: "tests, with Playwright" },
];

const REPO_URL = "https://github.com/polmarza/snapstack";

export function BuiltWith() {
  return (
    <section data-testid="landing-stack" className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
      <h2 className="text-center font-mono text-3xl font-bold">How it&apos;s built</h2>
      <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-content-secondary">
        You&apos;re a developer — you were going to check anyway. The code is public from the
        first commit, tests and all.
      </p>

      <ul className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {STACK.map(({ icon, name, role }) => (
          <li
            key={name}
            data-testid="landing-stack-item"
            className="flex flex-col items-center gap-2 rounded-xl border border-edge bg-surface px-3 py-5 text-center"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              width={26}
              height={26}
              fill="currentColor"
              className="text-content"
            >
              <path d={icon.path} />
            </svg>
            <span className="font-mono text-sm font-bold">{name}</span>
            <span className="text-xs leading-snug text-content-secondary">{role}</span>
          </li>
        ))}
      </ul>

      <div className="mt-10 text-center">
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="landing-stack-repo"
          className="inline-flex items-center gap-2 rounded-lg border border-edge px-5 py-2.5 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
        >
          <svg aria-hidden viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
            <path d={siGithub.path} />
          </svg>
          Read the source ↗
        </a>
      </div>
    </section>
  );
}
