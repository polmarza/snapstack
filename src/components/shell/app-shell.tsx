import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { AuthControls } from "@/components/auth/auth-controls";
import { createServiceClient } from "@/lib/db/client";
import { getProfileByClerkId } from "@/lib/db/profiles";
import { AppNav } from "./app-nav";
import { Logo } from "./logo";
import { DonateButton } from "./donate-button";
import { HideOnHome } from "./hide-on-home";
import { SiteFooter } from "./site-footer";

/**
 * Marco común de la app. Cambia según haya sesión o no:
 *
 * - **Con sesión**: navegación (lateral en desktop, inferior en móvil) y, en
 *   móvil, una cabecera con la marca y la donación. En desktop no hace falta
 *   cabecera: la barra lateral lo lleva todo.
 * - **Sin sesión**: cabecera con marca y botón de entrar, salvo en la home,
 *   donde eso lo cubre el héroe de la landing. La donación no se muestra: a
 *   quien todavía no conoce el producto solo le distrae.
 */
export async function AppShell({ children }: { children: React.ReactNode }) {
  let username: string | null = null;
  try {
    const user = await currentUser();
    if (user) {
      const profile = await getProfileByClerkId(createServiceClient(), user.id);
      username = profile?.username ?? null;
    }
  } catch {
    username = null; // sin perfil resuelto, la app se comporta como anónima
  }

  const wordmark = (
    <Link
      href="/"
      data-testid="header-wordmark"
      className="flex items-center gap-2.5 font-mono text-xl font-bold lowercase"
    >
      <Logo />
      snapstack
    </Link>
  );

  return (
    <>
      {username ? <AppNav username={username} /> : null}

      <div className={username ? "lg:pl-56" : ""}>
        {username ? (
          <header className="flex items-center gap-3 px-4 pt-4 sm:px-6 lg:hidden">
            {wordmark}
            <div className="ml-auto flex items-center gap-3">
              <DonateButton />
            </div>
          </header>
        ) : (
          <HideOnHome>
            <header className="flex items-center gap-3 px-4 pt-4 sm:px-6">
              {wordmark}
              <div className="ml-auto flex items-center gap-3">
                <AuthControls />
              </div>
            </header>
          </HideOnHome>
        )}

        {/* Hueco inferior para la barra de navegación de móvil. */}
        <div className={username ? "pb-24 lg:pb-0" : ""}>
          {children}
          <SiteFooter />
        </div>
      </div>
    </>
  );
}
