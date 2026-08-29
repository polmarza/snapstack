import { currentUser } from "@clerk/nextjs/server";
import { AuthControls } from "@/components/auth/auth-controls";
import { createServiceClient } from "@/lib/db/client";
import { getProfileByClerkId } from "@/lib/db/profiles";
import { AppNav } from "./app-nav";
import { DonateButton } from "./donate-button";

/**
 * Marco común de la app: controles de sesión y donación arriba a la derecha en
 * todas las páginas, y la navegación (lateral en desktop, inferior en móvil)
 * solo con sesión. El contenido se desplaza para no quedar debajo.
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

  return (
    <>
      {username ? <AppNav username={username} /> : null}

      <div className={username ? "lg:pl-56" : ""}>
        <header className="flex items-center justify-end gap-3 px-4 pt-4 sm:px-6">
          <DonateButton />
          <AuthControls />
        </header>

        {/* Hueco inferior para la barra de navegación de móvil. */}
        <div className={username ? "pb-24 lg:pb-0" : ""}>{children}</div>
      </div>
    </>
  );
}
