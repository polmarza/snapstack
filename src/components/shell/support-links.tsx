import { ArrowRight, Coffee, GitPullRequestArrow, Heart } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Las tres formas de apoyar el proyecto. Comparten forma —icono, etiqueta y
 * flecha— y se distinguen por el peso visual, que es lo que ordena la
 * intención:
 *
 * - **Sponsor** (GitHub Sponsors): el principal dentro de la app. A quien ya ha
 *   entrado con GitHub, patrocinar le cuesta dos clics y no sale de un sitio
 *   que ya conoce ni de una identidad que ya tiene abierta.
 * - **Buy me a coffee**: la vía para quien todavía no ha entrado. Vive solo en
 *   el footer, junto a la anterior: en la landing lee gente sin cuenta de
 *   GitHub, y dentro de la app esa vía sobra.
 * - **Contribute**: no pide dinero, pide manos. Va al repo de snapstack, que es
 *   público desde el primer commit. Va encima del de patrocinio porque para
 *   este público es la petición más fácil de aceptar.
 *
 * Son botones propios y no los widgets de cada plataforma: sus fondos no se
 * pueden configurar y cada uno añadía una petición externa en cada carga. El
 * precio es quedarse sin el contador de apoyos (ver MEJORA-06).
 */

const REPO_URL = "https://github.com/polmarza/snapstack";
const SPONSORS_URL = "https://github.com/sponsors/polmarza";
const COFFEE_URL = "https://www.buymeacoffee.com/polmarza";

function SupportLink({
  href,
  Icon,
  label,
  testId,
  tone,
  className = "",
}: {
  href: string;
  Icon: LucideIcon;
  label: string;
  testId: string;
  tone: "solid" | "outline";
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-testid={testId}
      className={`flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium transition ${
        tone === "solid"
          ? "bg-primary text-background hover:opacity-90"
          : "border border-edge text-content-secondary hover:text-content"
      } ${className}`}
    >
      <Icon size={16} strokeWidth={2.25} aria-hidden />
      {label}
      <ArrowRight size={16} strokeWidth={2.25} aria-hidden className="ml-auto" />
    </a>
  );
}

export function SponsorButton({
  className = "",
  label = "Sponsor",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <SupportLink
      href={SPONSORS_URL}
      Icon={Heart}
      label={label}
      testId="sponsor-button"
      tone="solid"
      className={className}
    />
  );
}

export function DonateButton({
  className = "",
  label = "Buy me a coffee",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <SupportLink
      href={COFFEE_URL}
      Icon={Coffee}
      label={label}
      testId="donate-button"
      tone="outline"
      className={className}
    />
  );
}

export function ContributeButton({
  className = "",
  label = "Contribute",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <SupportLink
      href={REPO_URL}
      Icon={GitPullRequestArrow}
      label={label}
      testId="contribute-button"
      tone="outline"
      className={className}
    />
  );
}
