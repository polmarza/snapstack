"use server";

import { redirect } from "next/navigation";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { deleteAccount } from "@/lib/db/account";
import { createServiceClient } from "@/lib/db/client";

export interface DeleteAccountResult {
  ok: boolean;
  error: string | null;
}

/** Borrado real de la cuenta (M-11). Solo puede borrarse el propio usuario. */
export async function deleteAccountAction(): Promise<DeleteAccountResult> {
  const { userId } = await auth();
  if (!userId) redirect("/");

  try {
    const client = await clerkClient();
    await deleteAccount(createServiceClient(), userId, (clerkId) =>
      client.users.deleteUser(clerkId),
    );
  } catch (error) {
    console.error("[deleteAccountAction]", error);
    return {
      ok: false,
      error: "We couldn't finish deleting your account. Your content is gone from the feed — please try again to close the account itself.",
    };
  }

  // Fuera del try: redirect() lanza una excepción interna de Next que el catch
  // no debe tragarse.
  redirect("/");
}
