/**
 * Botón de Buy Me a Coffee de Pol. Se usa su imagen oficial (la que genera su
 * button-api) con el texto "Donate": más corto y directo que el de por defecto.
 */
export function DonateButton({ className = "" }: { className?: string }) {
  return (
    <a
      href="https://www.buymeacoffee.com/polmarza"
      target="_blank"
      rel="noopener noreferrer"
      data-testid="donate-button"
      aria-label="Donate — buy me a coffee"
      className={`shrink-0 ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- imagen servida por Buy Me a Coffee */}
      <img
        src="https://img.buymeacoffee.com/button-api/?text=Donate&emoji=☕&slug=polmarza&button_colour=5F7FFF&font_colour=ffffff&font_family=Poppins&outline_colour=000000&coffee_colour=FFDD00"
        alt="Donate"
        className="h-9 w-auto rounded-lg"
      />
    </a>
  );
}
