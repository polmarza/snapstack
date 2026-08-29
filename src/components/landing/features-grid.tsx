import {
  Bell,
  GitCommitHorizontal,
  IdCard,
  ListChecks,
  Shuffle,
  Sparkles,
} from "lucide-react";

/**
 * Qué hay dentro, en fichas independientes. Cada una cuenta una decisión real
 * del producto (el límite de cinco, el determinismo de las tarjetas, el orden
 * barajado), no una promesa genérica.
 */

const FEATURES = [
  {
    Icon: ListChecks,
    title: "Pick five, on purpose",
    text: "A hard limit of five repos. The constraint is the product: your five best say more about you than eighty ever could.",
  },
  {
    Icon: Sparkles,
    title: "Cards, not screenshots",
    text: "Each repo becomes a card drawn from its own identity — a deterministic seed from its ID, coloured with its language's official GitHub colour. Same repo, same card, always.",
  },
  {
    Icon: IdCard,
    title: "A profile worth sharing",
    text: "snapstack.sh/u/you, with your tagline, bio and links. Public, indexable, and it brings its own cover when you paste it anywhere.",
  },
  {
    Icon: Shuffle,
    title: "A feed to browse, not to swipe",
    text: "Infinite scroll, no likes, no swiping. The order is shuffled on every visit, so the same authors never own the top of the feed.",
  },
  {
    Icon: Bell,
    title: "Follow devs, hear about it",
    text: "Follow the people whose work you like, and know when someone follows you. Passive on purpose: no streaks, no engagement games.",
  },
  {
    Icon: GitCommitHorizontal,
    title: "Keep up with the repos you like",
    text: "Subscribe to a repo and every push reaches your alerts with a link straight to the diff. Star it for real on GitHub without leaving the page.",
  },
];

export function FeaturesGrid() {
  return (
    <section data-testid="landing-features" className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
      <h2 className="text-center font-mono text-3xl font-bold">What you get</h2>
      <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-content-secondary">
        Everything here is built around one idea: fewer repos, better shown.
      </p>

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ Icon, title, text }) => (
          <article
            key={title}
            data-testid="landing-feature-card"
            className="flex flex-col items-center gap-3 rounded-xl border border-edge bg-surface p-5 text-center"
          >
            <Icon size={22} strokeWidth={1.75} aria-hidden className="text-primary" />
            <h3 className="font-mono text-base font-bold">{title}</h3>
            <p className="text-base leading-relaxed text-content-secondary">{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
