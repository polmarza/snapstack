"use server";

import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/db/client";
import { getProfileByClerkId } from "@/lib/db/profiles";

/**
 * Saltar el onboarding: marca `onboarded_at` para que la home deje de
 * redirigir. Sin esta salida, el usuario que no quiere importar nada quedaría
 * atrapado en un bucle.
 */
export async function skipOnboardingAction(): Promise<void> {
  const user = await currentUser();
  if (user) {
    try {
      const db = createServiceClient();
      const profile = await getProfileByClerkId(db, user.id);
      if (profile) {
        await db.from("profiles").update({ onboarded_at: new Date().toISOString() })
          .eq("id", profile.id).is("onboarded_at", null);
      }
    } catch (error) {
      console.error("[skipOnboardingAction]", error);
    }
  }
  // Fuera del try: redirect() lanza una excepción interna de Next.
  redirect("/");
}
