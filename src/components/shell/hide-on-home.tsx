"use client";

import { usePathname } from "next/navigation";

/**
 * Oculta su contenido en la home. Lo usa la cabecera de visitante: allí la
 * marca y el botón de entrar viven en el héroe de la landing, y repetirlos
 * arriba sería redundante. En el resto de páginas (un perfil, por ejemplo) la
 * cabecera sí hace falta.
 */
export function HideOnHome({ children }: { children: React.ReactNode }) {
  return usePathname() === "/" ? null : <>{children}</>;
}
