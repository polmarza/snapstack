import { ChevronDown } from "lucide-react";

/**
 * Preguntas frecuentes con <details> nativo: accesible, sin JavaScript y sin
 * estado que mantener. Las respuestas cuentan las decisiones reales del
 * producto (límite de 5, solo lectura, borrado real).
 */

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: "Is snapstack free?",
    a: "Yes. Sign in with GitHub and you're in — no card, no trial, no catch. If you like it, there's a donate button.",
  },
  {
    q: "What can snapstack do to my GitHub account?",
    a: "Read, and only read. We list your public repos so you can pick which ones to show; we never write, star, follow or touch anything on your behalf.",
  },
  {
    q: "Why only five repos?",
    a: "Because curation is the product. A profile with your five best says more than a dump of eighty — the limit is what makes people actually look.",
  },
  {
    q: "How are the card designs generated?",
    a: "Each card's background is generated from the repo's own identity: a deterministic seed from its ID, coloured with its dominant language's official GitHub colour. Same repo, same card, always — no AI, no screenshots.",
  },
  {
    q: "What if I delete a repo, or make it private on GitHub?",
    a: "It disappears from snapstack too. GitHub notifies us and the card is removed from the feed and your profile — no ghost content.",
  },
  {
    q: "Can I leave?",
    a: "Any time, from your account settings. Deletion is real: your profile, cards and activity are erased, not deactivated.",
  },
];

export function Faq() {
  return (
    <section data-testid="landing-faq" className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
      <h2 className="text-center font-mono text-3xl font-bold">Questions, answered</h2>
      <div className="mt-10 flex flex-col gap-3">
        {FAQS.map((item) => (
          <details key={item.q} className="group rounded-xl border border-edge bg-surface">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-lg font-medium [&::-webkit-details-marker]:hidden">
              {item.q}
              <ChevronDown
                size={18}
                aria-hidden
                className="shrink-0 text-content-secondary transition-transform group-open:rotate-180"
              />
            </summary>
            <p className="px-5 pb-5 text-lg text-content-secondary">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
