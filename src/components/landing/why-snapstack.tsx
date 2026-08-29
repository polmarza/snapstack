import { Archive, Search, Square } from "lucide-react";

/**
 * Por qué existe snapstack: el problema con el que todo dev convive, contado
 * sin adjetivos de folleto. Va antes que las funcionalidades — primero por qué
 * te importa, luego qué hay dentro.
 */

const PUNTOS = [
  {
    Icon: Archive,
    title: "It's an archive, not a portfolio",
    text: "Your repos are sorted by whatever you touched last, so the tutorial you followed in 2019 can outrank the thing you spent a year building.",
  },
  {
    Icon: Square,
    title: "Pinned repos are six grey boxes",
    text: "Same font, same layout, same everything as every other profile. Nothing in them says look at this one — so nobody clicks.",
  },
  {
    Icon: Search,
    title: "And finding what others build?",
    text: "Trending lists and search. You stumble onto projects, almost never onto the people behind them — and never onto the small ones worth seeing.",
  },
];

export function WhySnapstack() {
  return (
    <section data-testid="landing-why" className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
      <h2 className="text-center font-mono text-3xl font-bold">
        Your best work is in there, somewhere
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-content-secondary">
        GitHub shows everything you have ever pushed. Which means it shows nothing in
        particular.
      </p>

      <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
        {PUNTOS.map(({ Icon, title, text }) => (
          <div key={title} className="flex flex-col gap-3">
            <Icon size={22} strokeWidth={1.75} aria-hidden className="text-content-secondary" />
            <h3 className="font-mono text-base font-bold">{title}</h3>
            <p className="text-base leading-relaxed text-content-secondary">{text}</p>
          </div>
        ))}
      </div>

      <p className="mx-auto mt-12 max-w-2xl text-center text-lg leading-relaxed">
        snapstack turns it around: <span className="font-medium">five repos you choose</span>,
        as cards worth looking at, in a feed made for browsing what other devs are building.
      </p>
    </section>
  );
}
