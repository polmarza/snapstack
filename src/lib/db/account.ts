import type { Db } from "./client";
import { getProfileByClerkId } from "./profiles";

/**
 * Borrado de cuenta (M-11): real, no desactivación. La fila de `profiles`
 * arrastra por cascada sus repos y señales (FKs `on delete cascade`).
 *
 * Orden: primero los datos en Snapstack, después el usuario en Clerk — prioriza
 * que el contenido desaparezca del feed aunque el segundo paso falle (y ese
 * fallo es reintentable porque la sesión sigue viva). Idempotente: sin fila de
 * perfil, se salta directamente al borrado en Clerk.
 */
export async function deleteAccount(
  db: Db,
  clerkId: string,
  deleteClerkUser: (clerkId: string) => Promise<unknown>,
): Promise<{ profileDeleted: boolean }> {
  const profile = await getProfileByClerkId(db, clerkId);

  let profileDeleted = false;
  if (profile) {
    const { error } = await db.from("profiles").delete().eq("id", profile.id);
    if (error) throw new Error(`Error al borrar el perfil: ${error.message}`);
    profileDeleted = true;
  }

  await deleteClerkUser(clerkId);
  return { profileDeleted };
}
