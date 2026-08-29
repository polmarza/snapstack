/**
 * Reescritura de URLs del README (C-05). El README es contenido de terceros
 * que se renderiza en nuestra página: los enlaces relativos apuntan dentro del
 * repo en GitHub, y cualquier esquema que no sea http(s)/mailto se anula.
 * react-markdown ya descarta el HTML crudo; esto cubre la otra mitad.
 */

const SAFE_ABSOLUTE = /^(https?:|mailto:)/i;
const HAS_SCHEME = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;

/**
 * Devuelve la URL segura para un href/src del README de `fullName`, o "" para
 * anularla. `kind` decide el destino de las relativas: los enlaces van a la
 * vista de archivo (`blob`) y las imágenes al contenido crudo
 * (raw.githubusercontent), que es lo que GitHub mismo hace al renderizar.
 */
export function resolveReadmeUrl(
  url: string,
  fullName: string,
  kind: "link" | "image",
): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (SAFE_ABSOLUTE.test(trimmed)) return trimmed;
  if (HAS_SCHEME.test(trimmed) || trimmed.startsWith("//")) return ""; // javascript:, data:, protocolo relativo…
  if (trimmed.startsWith("#")) return trimmed; // anclas dentro de la página

  const path = trimmed.replace(/^\.?\//, "");
  return kind === "image"
    ? `https://raw.githubusercontent.com/${fullName}/HEAD/${path}`
    : `https://github.com/${fullName}/blob/HEAD/${path}`;
}
