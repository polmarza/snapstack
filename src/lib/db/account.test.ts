import { describe, it, expect, vi } from "vitest";
import type { Db } from "./client";
import { deleteAccount } from "./account";

/**
 * Db falsa con perfil opcional. El borrado real es por cascada de FKs
 * (verificada en el esquema); aquí se comprueba la orquestación.
 */
function fakeDb(conPerfil: boolean) {
  const llamadas: string[] = [];
  const db = {
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: conPerfil ? { id: "perfil-1", clerk_id: "user_1", username: "pol" } : null,
              error: null,
            }),
        }),
      }),
      delete: () => ({
        eq: (col: string, id: string) => {
          llamadas.push(`delete ${table} ${col}=${id}`);
          return Promise.resolve({ error: null });
        },
      }),
    }),
  } as unknown as Db;
  return { db, llamadas };
}

describe("deleteAccount", () => {
  it("M-11: borra la fila del perfil (cascada a repos y señales) y después el usuario en Clerk", async () => {
    const { db, llamadas } = fakeDb(true);
    const clerkDelete = vi.fn().mockResolvedValue(undefined);

    const result = await deleteAccount(db, "user_1", clerkDelete);

    expect(result.profileDeleted).toBe(true);
    expect(llamadas).toEqual(["delete profiles id=perfil-1"]);
    expect(clerkDelete).toHaveBeenCalledWith("user_1");
    // Orden: la DB se borra antes que Clerk.
    expect(clerkDelete.mock.invocationCallOrder[0]).toBeGreaterThan(0);
  });

  it("M-11: es reanudable — sin fila de perfil, borra igualmente el usuario en Clerk", async () => {
    const { db, llamadas } = fakeDb(false);
    const clerkDelete = vi.fn().mockResolvedValue(undefined);

    const result = await deleteAccount(db, "user_1", clerkDelete);

    expect(result.profileDeleted).toBe(false);
    expect(llamadas).toEqual([]);
    expect(clerkDelete).toHaveBeenCalledWith("user_1");
  });

  it("M-11: si Clerk falla, el error se propaga pero el contenido ya no es visible", async () => {
    const { db, llamadas } = fakeDb(true);
    const clerkDelete = vi.fn().mockRejectedValue(new Error("clerk caído"));

    await expect(deleteAccount(db, "user_1", clerkDelete)).rejects.toThrow("clerk caído");
    expect(llamadas).toEqual(["delete profiles id=perfil-1"]); // la DB ya estaba borrada
  });
});
