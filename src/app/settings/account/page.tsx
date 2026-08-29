import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { DeleteAccount } from "@/components/account/delete-account";

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const user = await currentUser();
  if (!user) redirect("/");

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Link href="/" className="font-mono text-sm text-content-secondary hover:text-content">
        ← Back to feed
      </Link>
      <header className="mt-4 mb-8">
        <h1 className="font-mono text-2xl font-bold">Account</h1>
        <p className="mt-1 text-sm text-content-secondary">
          Manage your Snapstack account. Your repo selection lives in{" "}
          <Link href="/settings/repos" className="text-primary hover:underline">
            My repos
          </Link>
          .
        </p>
      </header>

      <DeleteAccount />
    </main>
  );
}
