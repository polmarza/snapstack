import { ArrowRight, Coffee } from "lucide-react";

/**
 * Enlace de donación a Buy Me a Coffee, con el verde de marca (el mismo del
 * favicon) y el contenido oscuro encima.
 *
 * Es un botón propio y no la imagen de su button-api por dos motivos: el
 * contador de apoyos venía sobre un fondo de otro tono que su API no deja
 * configurar, y así no hay una petición externa en cada carga. El contrapunto
 * es que se pierde ese contador: recuperarlo exigiría la API autenticada de
 * Buy Me a Coffee (token personal) y cachear la cifra.
 */
export function DonateButton({ className = "" }: { className?: string }) {
  return (
    <a
      href="https://www.buymeacoffee.com/polmarza"
      target="_blank"
      rel="noopener noreferrer"
      data-testid="donate-button"
      className={`flex h-9 shrink-0 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-background transition-opacity hover:opacity-90 ${className}`}
    >
      <Coffee size={16} strokeWidth={2.25} aria-hidden />
      Donate
      <ArrowRight size={16} strokeWidth={2.25} aria-hidden className="ml-auto" />
    </a>
  );
}
