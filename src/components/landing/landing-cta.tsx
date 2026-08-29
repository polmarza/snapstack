import { AuthControls } from "@/components/auth/auth-controls";

/** Cierre de la landing: última invitación a entrar antes del feed en vivo. */
export function LandingCta() {
  return (
    <section data-testid="landing-cta" className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
      <div className="rounded-3xl border border-primary/30 bg-gradient-to-b from-surface to-background px-6 py-14">
        <h2 className="font-mono text-3xl font-bold sm:text-4xl">
          Your repos already tell a story.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-content-secondary">
          Give them a place where people actually scroll, look, and follow the person behind
          the code.
        </p>
        <div className="mt-8 flex justify-center">
          <AuthControls size="lg" />
        </div>
        <p className="mt-4 font-mono text-xs text-content-secondary">
          Free · read-only · leave whenever you want
        </p>
      </div>
    </section>
  );
}
