"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";

/**
 * Navegación de la app, solo con sesión: barra lateral en desktop y barra
 * inferior en móvil (donde el pulgar llega). El item activo sale del pathname.
 */

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "h-5 w-5 shrink-0",
};

const FeedIcon = () => (
  <svg {...iconProps} aria-hidden>
    <rect x="3" y="4" width="18" height="7" rx="2" />
    <rect x="3" y="14" width="18" height="6" rx="2" />
  </svg>
);
const ProfileIcon = () => (
  <svg {...iconProps} aria-hidden>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c0-3.3 3.1-5.5 7-5.5s7 2.2 7 5.5" />
  </svg>
);
const ReposIcon = () => (
  <svg {...iconProps} aria-hidden>
    <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v14H6.5A1.5 1.5 0 0 0 5 18.5z" />
    <path d="M5 18.5A1.5 1.5 0 0 0 6.5 20H19v-3" />
  </svg>
);
const AccountIcon = () => (
  <svg {...iconProps} aria-hidden>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 2.6 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H7a1.6 1.6 0 0 0 1-1.5V1a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V7a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
  </svg>
);
const SignOutIcon = () => (
  <svg {...iconProps} aria-hidden>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
);

export function AppNav({ username }: { username: string }) {
  const pathname = usePathname();

  const items = [
    { href: "/", label: "Feed", Icon: FeedIcon, activo: pathname === "/" },
    {
      href: `/u/${username}`,
      label: "Profile",
      Icon: ProfileIcon,
      activo: pathname === `/u/${username}`,
    },
    {
      href: "/settings/repos",
      label: "Repos",
      Icon: ReposIcon,
      activo: pathname.startsWith("/settings/repos"),
    },
    {
      href: "/settings/account",
      label: "Account",
      Icon: AccountIcon,
      activo: pathname.startsWith("/settings/account"),
    },
  ];

  return (
    <>
      {/* Desktop: barra lateral fija */}
      <nav
        data-testid="app-nav"
        aria-label="Main"
        className="fixed inset-y-0 left-0 z-20 hidden w-56 flex-col gap-1 border-r border-edge bg-background px-3 py-6 lg:flex"
      >
        <span className="mb-4 px-3 font-mono text-lg font-bold lowercase">snapstack</span>
        {items.map(({ href, label, Icon, activo }) => (
          <Link
            key={href}
            href={href}
            data-testid={`nav-${label.toLowerCase()}`}
            aria-current={activo ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              activo ? "bg-surface text-content" : "text-content-secondary hover:text-content"
            }`}
          >
            <Icon />
            {label}
          </Link>
        ))}
        <SignOutButton>
          <button
            type="button"
            data-testid="nav-sign-out"
            className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-content-secondary transition-colors hover:text-error"
          >
            <SignOutIcon />
            Sign out
          </button>
        </SignOutButton>
      </nav>

      {/* Móvil: barra inferior */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-20 flex items-stretch justify-around border-t border-edge bg-background/95 backdrop-blur lg:hidden"
      >
        {items.map(({ href, label, Icon, activo }) => (
          <Link
            key={href}
            href={href}
            aria-current={activo ? "page" : undefined}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] ${
              activo ? "text-primary" : "text-content-secondary"
            }`}
          >
            <Icon />
            {label}
          </Link>
        ))}
        <SignOutButton>
          <button
            type="button"
            className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] text-content-secondary"
          >
            <SignOutIcon />
            Sign out
          </button>
        </SignOutButton>
      </nav>
    </>
  );
}
