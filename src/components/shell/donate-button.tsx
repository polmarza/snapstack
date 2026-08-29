/**
 * Botón de Buy Me a Coffee de Pol. Se usa su imagen oficial (la que genera su
 * button-api), con la altura acotada para que case con el resto de la cabecera.
 */
export function DonateButton() {
  return (
    <a
      href="https://www.buymeacoffee.com/polmarza"
      target="_blank"
      rel="noopener noreferrer"
      data-testid="donate-button"
      aria-label="Buy me a coffee"
      className="shrink-0"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- imagen servida por Buy Me a Coffee */}
      <img
        src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=⭐&slug=polmarza&button_colour=5F7FFF&font_colour=ffffff&font_family=Poppins&outline_colour=000000&coffee_colour=FFDD00"
        alt="Buy me a coffee"
        className="h-9 w-auto rounded-lg"
      />
    </a>
  );
}
