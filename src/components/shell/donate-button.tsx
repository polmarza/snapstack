import { Coffee } from "lucide-react";

/**
 * Enlace de donación a Buy Me a Coffee. Es un botón propio y no la imagen que
 * genera su button-api: el contador de apoyos venía con un fondo de otro tono y
 * ese detalle no se puede configurar por parámetro. De paso quita una petición
 * externa en cada carga. Se conserva su azul para que la marca se reconozca.
 */
export function DonateButton({ className = "" }: { className?: string }) {
  return (
    <a
      href="https://www.buymeacoffee.com/polmarza"
      target="_blank"
      rel="noopener noreferrer"
      data-testid="donate-button"
      className={`flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#5F7FFF] px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 ${className}`}
    >
      <Coffee size={16} strokeWidth={2} aria-hidden />
      Donate
    </a>
  );
}
