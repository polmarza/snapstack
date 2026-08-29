import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { SignOutButton } from "@clerk/nextjs";
import { LogOut } from "lucide-react";
import { DeleteAccount } from "@/components/account/delete-account";
import { ProfileForm } from "@/components/account/profile-form";
import { createServiceClient } from "@/lib/db/client";
import { getProfileByClerkId } from "@/lib/db/profiles";
import { parseStoredSocialLinks } from "@/lib/profile/social-links";

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const user = await currentUser();
  if (!user) redirect("/");

  const profile = await getProfileByClerkId(createServiceClient(), user.id).catch(() => null);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <h1 className="font-mono text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-content-secondary">
          Manage your snapstack account. Your repo selection lives in{" "}
          <Link href="/settings/repos" className="text-primary hover:underline">
            My repos
          </Link>
          .
        </p>
      </header>

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
