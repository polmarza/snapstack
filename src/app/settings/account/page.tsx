import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { SignOutButton } from "@clerk/nextjs";
import { BookMarked, ChevronRight, LogOut } from "lucide-react";
import { DeleteAccount } from "@/components/account/delete-account";
import { ProfileForm } from "@/components/account/profile-form";
import { GithubAppSection } from "@/components/account/github-app-section";
import { syncInstallationState } from "@/lib/db/installation";
import { createServiceClient } from "@/lib/db/client";
import { getProfileByClerkId } from "@/lib/db/profiles";
import { parseStoredSocialLinks } from "@/lib/profile/social-links";

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const user = await currentUser();
  if (!user) redirect("/");

  const db = createServiceClient();
  const profile = await getProfileByClerkId(db, user.id).catch(() => null);

  // El estado real de la instalación se comprueba aquí (C-08): los webhooks
  // pueden haberse perdido, y actualizar una instalación no reemite el alta.
  const installationId = profile
    ? await syncInstallationState(db, profile.id, profile.github_installation_id ?? null).catch(
        () => profile.github_installation_id ?? null,
      )
    : null;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <h1 className="font-mono text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-content-secondary">
          Manage your snapstack account.
        </p>
      </header>

      {/* La selección de repos salió de la navegación principal (C-11) y su
          puerta es esta: una entrada de verdad, no una frase con un enlace
          dentro, que es lo que había y no se veía. */}
      <Link
        href="/settings/repos"
        data-testid="settings-repos-link"
        className="mb-10 flex items-center gap-3 rounded-xl border border-edge p-4 transition-colors hover:border-primary"
      >
        <BookMarked size={20} strokeWidth={1.75} aria-hidden className="shrink-0 text-primary" />
        <span className="min-w-0 flex-1">
          <span className="block font-mono text-sm font-bold">My repos</span>
          <span className="block text-sm text-content-secondary">
            Pick the five repos your profile shows.
          </span>
        </span>
        <ChevronRight size={18} strokeWidth={1.75} aria-hidden className="shrink-0 text-content-secondary" />
      </Link>

      {profile ? <GithubAppSection installed={installationId != null} /> : null}

      {profile ? (
        <ProfileForm
          initialTagline={profile.tagline ?? ""}
          initialBio={profile.bio ?? ""}
          initialLinks={parseStoredSocialLinks(profile.social_links)}
        />
      ) : null}

      <section data-testid="session-section" className="mb-10">
        <h2 className="font-mono text-lg font-bold">Session</h2>
        <SignOutButton>
          <button
            type="button"
            data-testid="settings-sign-out"
            className="mt-3 flex items-center gap-2 rounded-lg border border-edge px-4 py-2 text-sm text-content-secondary transition-colors hover:text-content"
          >
            <LogOut size={16} strokeWidth={1.75} aria-hidden />
            Sign out
          </button>
        </SignOutButton>
      </section>

      <DeleteAccount />
    </main>
  );
}
