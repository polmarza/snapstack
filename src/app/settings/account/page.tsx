import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
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

      <DeleteAccount />
    </main>
  );
}
