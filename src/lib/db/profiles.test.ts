import { describe, it, expect } from "vitest";
import type { Db } from "./client";
import {
  ensureProfile,
  mapClerkUserToProfile,
  getProfileByUsername,
  type ClerkUserLike,
  type ProfileRow,
} from "./profiles";

const clerkUser = (extra: Partial<ClerkUserLike> = {}): ClerkUserLike => ({
  id: "user_2abc",
  username: "pol-clerk",
  firstName: "Pol",
  lastName: "Marzà",
  imageUrl: "https://img.clerk.com/fallback.png",
  externalAccounts: [
    {
      provider: "oauth_github",
      externalId: "583231",
      username: "polmarza",
      imageUrl: "https://avatars.githubusercontent.com/u/583231",
    },
  ],
  ...extra,
});

/** Db falsa: upsert de perfiles en memoria por clerk_id. */
function fakeDb() {
  const store = new Map<string, ProfileRow>();
  const db = {
    from: (table: string) => ({
      upsert: (row: ProfileRow, opts: { onConflict: string }) => {
        expect(table).toBe("profiles");
        expect(opts.onConflict).toBe("clerk_id");
        store.set(row.clerk_id, row);
        return Promise.resolve({ error: null });
      },
    }),
  } as unknown as Db;
  return { db, store };
}

describe("mapClerkUserToProfile", () => {
  it("M-01: extrae la identidad de GitHub de la cuenta externa", () => {
    const row = mapClerkUserToProfile(clerkUser());
    expect(row.clerk_id).toBe("user_2abc");
    expect(row.github_id).toBe(583231);
    expect(row.username).toBe("polmarza");
    expect(row.display_name).toBe("Pol Marzà");
    expect(row.avatar_url).toBe("https://avatars.githubusercontent.com/u/583231");
  });

  it("M-01: sin cuenta de GitHub cae al username y avatar de Clerk", () => {
    const row = mapClerkUserToProfile(clerkUser({ externalAccounts: [] }));
    expect(row.github_id).toBeNull();
    expect(row.username).toBe("pol-clerk");
    expect(row.avatar_url).toBe("https://img.clerk.com/fallback.png");
  });

  it("M-01: sin ningún username genera uno estable a partir del id", () => {
    const row = mapClerkUserToProfile(clerkUser({ username: null, externalAccounts: [] }));
    expect(row.username).toBe("user_ser_2abc"); // user_ + últimos 8 caracteres del clerk_id
    const otraVez = mapClerkUserToProfile(clerkUser({ username: null, externalAccounts: [] }));
    expect(otraVez.username).toBe(row.username);
  });
});

describe("ensureProfile", () => {
  it("M-01: primer login crea el perfil", async () => {
    const { db, store } = fakeDb();
    const row = await ensureProfile(db, clerkUser());
    expect(row).not.toBeNull();
    expect(store.size).toBe(1);
    expect(store.get("user_2abc")?.username).toBe("polmarza");
  });

  it("M-01: logins posteriores recuperan sin duplicar (idempotente por clerk_id)", async () => {
    const { db, store } = fakeDb();
    await ensureProfile(db, clerkUser());
    await ensureProfile(db, clerkUser({ imageUrl: "https://img.clerk.com/nuevo.png", externalAccounts: [] }));
    expect(store.size).toBe(1);
    expect(store.get("user_2abc")?.avatar_url).toBe("https://img.clerk.com/nuevo.png");
  });

  it("M-01 (negativo): sin sesión no se crea ningún perfil a medias", async () => {
    const { db, store } = fakeDb();
    const row = await ensureProfile(db, null);
    expect(row).toBeNull();
    expect(store.size).toBe(0);
  });
});

describe("getProfileByUsername", () => {
  const fakeDbConPerfil = (perfil: (ProfileRow & { id: string }) | null) =>
    ({
      from: () => ({
        select: () => ({
          eq: (col: string, valor: string) => ({
            maybeSingle: () =>
              Promise.resolve({
                data: perfil && col === "username" && perfil.username === valor ? perfil : null,
                error: null,
              }),
          }),
        }),
      }),
    }) as unknown as Db;

  const perfil = { id: "uuid-1", ...mapClerkUserToProfile(clerkUser()) };

  it("M-05: encuentra el perfil por su username (login de GitHub)", async () => {
    const encontrado = await getProfileByUsername(fakeDbConPerfil(perfil), "polmarza");
    expect(encontrado?.id).toBe("uuid-1");
    expect(encontrado?.username).toBe("polmarza");
  });

  it("M-05: un username inexistente devuelve null (la página hace 404)", async () => {
    expect(await getProfileByUsername(fakeDbConPerfil(perfil), "nadie")).toBeNull();
    expect(await getProfileByUsername(fakeDbConPerfil(null), "polmarza")).toBeNull();
  });
});
