import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import type { Db } from "@/lib/db/client";
import type { RepoRow } from "@/lib/db/repos";
import { verifyGithubSignature, handleGithubEvent, type WebhookRepository } from "./webhooks";

const SECRET = "secreto-de-test";
const firmar = (body: string) => `sha256=${createHmac("sha256", SECRET).update(body).digest("hex")}`;

describe("verifyGithubSignature", () => {
  it("M-08: acepta la firma correcta", () => {
    const body = JSON.stringify({ hola: "mundo" });
    expect(verifyGithubSignature(body, firmar(body), SECRET)).toBe(true);
  });

  it("M-08: rechaza firma inválida, ausente o de otro secreto", () => {
    const body = "{}";
    expect(verifyGithubSignature(body, null, SECRET)).toBe(false);
    expect(verifyGithubSignature(body, "sha256=deadbeef", SECRET)).toBe(false);
    expect(verifyGithubSignature(body, firmar("otro cuerpo"), SECRET)).toBe(false);
    const otra = `sha256=${createHmac("sha256", "otro-secreto").update(body).digest("hex")}`;
    expect(verifyGithubSignature(body, otra, SECRET)).toBe(false);
  });
});

const webhookRepo = (extra: Partial<WebhookRepository> = {}): WebhookRepository => ({
  id: 42,
  full_name: "polmarza/snapstack",
  description: "Nueva descripción",
  html_url: "https://github.com/polmarza/snapstack",
  language: "TypeScript",
  topics: ["nextjs"],
  stargazers_count: 99,
  ...extra,
});

/** Db falsa: solo UPDATE por github_repo_id — un insert haría fallar el test. */
function fakeDb(filas: Array<Partial<RepoRow> & { github_repo_id: number }>) {
  const store = new Map(filas.map((f) => [f.github_repo_id, { ...f }]));
  const db = {
    from: () => ({
      update: (patch: Record<string, unknown>) => ({
        eq: (col: string, id: number) => {
          expect(col).toBe("github_repo_id");
          const row = store.get(id);
          if (row) store.set(id, { ...row, ...patch });
          return Promise.resolve({ error: null });
        },
      }),
      insert: () => {
        throw new Error("el webhook nunca inserta");
      },
      upsert: () => {
        throw new Error("el webhook nunca inserta");
      },
    }),
  } as unknown as Db;
  return { db, store };
}

describe("handleGithubEvent", () => {
  it("M-08: push refresca descripción, lenguaje, topics, stars y nombre", async () => {
    const { db, store } = fakeDb([{ github_repo_id: 42, stars: 1, description: "vieja" }]);
    const result = await handleGithubEvent(db, "push", { repository: webhookRepo() });
    expect(result.handled).toBe(true);
    const fila = store.get(42) as Record<string, unknown>;
    expect(fila.description).toBe("Nueva descripción");
    expect(fila.stars).toBe(99);
    expect(fila.primary_language).toBe("TypeScript");
    expect(fila.full_name).toBe("polmarza/snapstack");
  });

  it("M-08: star (y watch, el nombre legado) actualizan el contador", async () => {
    const { db, store } = fakeDb([{ github_repo_id: 42, stars: 1 }]);
    await handleGithubEvent(db, "star", { repository: webhookRepo({ stargazers_count: 100 }) });
    expect((store.get(42) as Record<string, unknown>).stars).toBe(100);
    await handleGithubEvent(db, "watch", { repository: webhookRepo({ stargazers_count: 101 }) });
    expect((store.get(42) as Record<string, unknown>).stars).toBe(101);
  });

  it("M-08: deleted y privatized retiran el repo — sin contenido fantasma", async () => {
    for (const action of ["deleted", "privatized"]) {
      const { db, store } = fakeDb([{ github_repo_id: 42, status: "active" }]);
      const result = await handleGithubEvent(db, "repository", { action, repository: webhookRepo() });
      expect(result.handled).toBe(true);
      expect((store.get(42) as Record<string, unknown>).status).toBe("removed");
    }
  });

  it("M-08: publicized reactiva; renamed refresca nombre y URL", async () => {
    const { db, store } = fakeDb([{ github_repo_id: 42, status: "removed", full_name: "p/viejo" }]);
    await handleGithubEvent(db, "repository", { action: "publicized", repository: webhookRepo() });
    expect((store.get(42) as Record<string, unknown>).status).toBe("active");

    await handleGithubEvent(db, "repository", {
      action: "renamed",
      repository: webhookRepo({ full_name: "polmarza/renombrado", html_url: "https://github.com/polmarza/renombrado" }),
    });
    expect((store.get(42) as Record<string, unknown>).full_name).toBe("polmarza/renombrado");
  });

  it("M-08: un repo desconocido no produce efecto y nunca se inserta", async () => {
    const { db, store } = fakeDb([{ github_repo_id: 7 }]);
    await handleGithubEvent(db, "push", { repository: webhookRepo({ id: 999 }) });
    expect(store.size).toBe(1);
    expect(store.has(999)).toBe(false);
  });

  it("M-08: eventos sin repository o no contemplados se ignoran", async () => {
    const { db } = fakeDb([]);
    expect((await handleGithubEvent(db, "push", {})).handled).toBe(false);
    expect((await handleGithubEvent(db, "issues", { repository: webhookRepo() })).handled).toBe(false);
    expect((await handleGithubEvent(db, "repository", { action: "archived", repository: webhookRepo() })).handled).toBe(false);
  });
});

describe("handleGithubEvent: installation (C-08)", () => {
  function fakeProfilesDb() {
    const perfiles = [
      { id: "p1", github_id: 111, github_installation_id: null as number | null },
      { id: "p2", github_id: 222, github_installation_id: 77 as number | null },
    ];
    const db = {
      from: (table: string) => {
        expect(table).toBe("profiles");
        return {
          update: (patch: { github_installation_id: number | null }) => ({
            eq: (_col: string, accountId: number) => {
              for (const p of perfiles) {
                if (p.github_id === accountId) p.github_installation_id = patch.github_installation_id;
              }
              return Promise.resolve({ error: null });
            },
          }),
        };
      },
    } as unknown as Parameters<typeof handleGithubEvent>[0];
    return { db, perfiles };
  }

  const payload = (action: string, installationId = 9001, accountId = 111) => ({
    action,
    installation: { id: installationId, account: { id: accountId } },
  });

  it("installation.created registra el id en el perfil de esa cuenta", async () => {
    const { db, perfiles } = fakeProfilesDb();
    const result = await handleGithubEvent(db, "installation", payload("created"));
    expect(result.handled).toBe(true);
    expect(perfiles[0].github_installation_id).toBe(9001);
    expect(perfiles[1].github_installation_id).toBe(77); // otra cuenta, intacta
  });

  it("installation.deleted la limpia; una cuenta sin perfil no rompe nada", async () => {
    const { db, perfiles } = fakeProfilesDb();
    await handleGithubEvent(db, "installation", payload("deleted", 77, 222));
    expect(perfiles[1].github_installation_id).toBeNull();

    const sinPerfil = await handleGithubEvent(db, "installation", payload("created", 5, 999));
    expect(sinPerfil.handled).toBe(true); // el update simplemente no encuentra fila
  });

  it("installation_repositories registra la instalación al cambiar los repos cubiertos", async () => {
    // El caso real: la App ya estaba instalada, así que `installation.created`
    // no se reemite — solo llega este evento.
    const { db, perfiles } = fakeProfilesDb();
    const result = await handleGithubEvent(db, "installation_repositories", {
      action: "added",
      installation: { id: 9001, account: { id: 111 } },
    });
    expect(result.handled).toBe(true);
    expect(perfiles[0].github_installation_id).toBe(9001);
  });

  it("un payload incompleto o una acción desconocida se ignoran", async () => {
    const { db } = fakeProfilesDb();
    expect((await handleGithubEvent(db, "installation", { action: "created" })).handled).toBe(false);
    expect((await handleGithubEvent(db, "installation", payload("banana"))).handled).toBe(false);
  });
});
