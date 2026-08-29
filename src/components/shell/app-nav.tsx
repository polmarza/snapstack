"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import { Bell, LayoutList, LogOut, Settings, User, BookMarked } from "lucide-react";
import { NOTIFICATIONS_READ_EVENT } from "@/components/notifications/mark-read-on-open";
import { DonateButton } from "./donate-button";
import { Logo } from "./logo";

/**
 * Navegación de la app, solo con sesión: barra lateral en desktop y barra
 * inferior en móvil (donde llega el pulgar). El item activo sale del pathname.
 *
 * Los enlaces son `prefetch` por defecto en Next, y cada ruta tiene su
 * `loading.tsx`: al pulsar, el esqueleto aparece al instante.
 */

const items = [
  { href: "/", label: "Feed", Icon: LayoutList, match: (p: string) => p === "/" },
  { href: "__profile__", label: "Profile", Icon: User, match: (p: string) => p.startsWith("/u/") },
  {
    href: "/notifications",
    label: "Alerts",
    Icon: Bell,
    match: (p: string) => p.startsWith("/notifications"),
  },
  {
    href: "/settings/repos",
    label: "Repos",
    Icon: BookMarked,
    match: (p: string) => p.startsWith("/settings/repos"),
  },
  {
    href: "/settings/account",
    label: "Settings",
    Icon: Settings,
    match: (p: string) => p.startsWith("/settings/account"),
    // En móvil, Settings se llega desde el botón del propio perfil: la barra
    // inferior va justa de sitio y crecerá (feedback de Pol, 2026-08-29).
    mobileHidden: true,
  },
];

export function AppNav({
  username,
  unreadNotifications = 0,
}: {
  username: string;
  unreadNotifications?: number;
}) {
  const pathname = usePathname();

  // El badge (C-04) llega del servidor al montar; abrir /notifications lo pone
  // a cero por evento — el layout no se re-renderiza al navegar.
  const [unread, setUnread] = useState(unreadNotifications);
  useEffect(() => {
    const clear = () => setUnread(0);
    window.addEventListener(NOTIFICATIONS_READ_EVENT, clear);
    return () => window.removeEventListener(NOTIFICATIONS_READ_EVENT, clear);
  }, []);

  const badge =
    unread > 0 ? (
      <span
        data-testid="nav-alerts-badge"
        className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 font-mono text-[10px] font-bold leading-none text-background"
      >
        {unread > 9 ? "9+" : unread}
      </span>
    ) : null;

  const destinos = items.map((item) => ({
    ...item,
    href: item.href === "__profile__" ? `/u/${username}` : item.href,
    activo: item.match(pathname),
  }));

  return (
    <>
      {/* Desktop: barra lateral fija */}
      <nav
        data-testid="app-nav"
        aria-label="Main"
        className="fixed inset-y-0 left-0 z-20 hidden w-56 flex-col gap-1 border-r border-edge bg-background px-3 py-6 lg:flex"
      >
        <span className="mb-4 flex items-center gap-2.5 px-3 font-mono text-lg font-bold lowercase">
          <Logo size={24} />
          snapstack
        </span>

        {destinos.map(({ href, label, Icon, activo }) => (
          <Link
            key={label}
            href={href}
            data-testid={`nav-${label.toLowerCase()}`}
            aria-current={activo ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              activo ? "bg-surface text-content" : "text-content-secondary hover:text-content"
            }`}
          >
            <span className="relative">
              <Icon size={20} strokeWidth={1.75} aria-hidden />
              {label === "Alerts" ? badge : null}
            </span>
            {label}
          </Link>
        ))}

        <div className="mt-auto flex flex-col gap-3">
          {/* En desktop la donación vive aquí; en móvil, en la cabecera. */}
          <DonateButton className="w-full" />
          <SignOutButton>
            <button
              type="button"
              data-testid="nav-sign-out"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-content-secondary transition-colors hover:text-error"
            >
              <LogOut size={20} strokeWidth={1.75} aria-hidden />
              Sign out
            </button>
          </SignOutButton>
        </div>
      </nav>

      {/* Móvil: barra inferior */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-20 flex items-stretch justify-around border-t border-edge bg-background/95 backdrop-blur lg:hidden"
      >
        {destinos.filter((d) => !d.mobileHidden).map(({ href, label, Icon, activo }) => (
          <Link
            key={label}
            href={href}
            aria-current={activo ? "page" : undefined}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] ${
              activo ? "text-primary" : "text-content-secondary"
            }`}
          >
            <span className="relative">
              <Icon size={20} strokeWidth={1.75} aria-hidden />
              {label === "Alerts" ? badge : null}
            </span>
            {label}
          </Link>
        ))}
        <SignOutButton>
          <button
            type="button"
            className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] text-content-secondary"
          >
            <LogOut size={20} strokeWidth={1.75} aria-hidden />
            Sign out
          </button>
        </SignOutButton>
      </nav>
    </>
  );
}
