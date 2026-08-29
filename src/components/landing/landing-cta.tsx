import { AuthControls } from "@/components/auth/auth-controls";

/**
 * Cierre de la landing: última invitación a entrar. Va a sangre y en el verde
 * de marca — es el único bloque que pide algo, así que corta con todo lo
 * anterior. El texto usa el color de fondo (oscuro), que es lo legible sobre
 * el verde, y el botón cambia de blanco a oscuro por lo mismo.
 */
export function LandingCta() {
  return (
    <section
      data-testid="landing-cta"
      className="w-full bg-primary px-4 py-20 text-center text-background sm:px-6"
    >
      <div className="mx-auto max-w-3xl">
        <h2 className="font-mono text-3xl font-bold sm:text-4xl">
          Your repos already tell a story.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-lg text-background/75">
          Give them a place where people actually scroll, look, and follow the person behind
          the code.
        </p>
        <div className="mt-8 flex justify-center">
          <AuthControls size="lg" tone="onPrimary" />
        </div>
        <p className="mt-4 font-mono text-xs text-background/70">
          Free · read-only · leave whenever you want
        </p>
      </div>
    </section>
  );
}
