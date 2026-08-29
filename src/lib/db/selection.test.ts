import { describe, it, expect, afterEach } from "vitest";
import type { Db } from "./client";
import type { RepoRow } from "./repos";
import {
  computeSelectionDiff,
  validateSelectionSize,
  selectionLimit,
  SelectionLimitError,
  importOwnedRepos,
  removeOwnedRepos,
} from "./selection";

const fila = (n: number, extra: Partial<RepoRow> = {}): RepoRow => ({
  github_repo_id: n,
  owner_profile_id: "perfil-pol",
  owner_login: "polmarza",
  owner_avatar_url: null,
  full_name: `polmarza/repo-${n}`,
  description: null,
  url: `https://github.com/polmarza/repo-${n}`,
  primary_language: "TypeScript",
  languages: {},
  topics: [],
  stars: 1,
  card_seed: "deadbeef",
  status: "active",
  is_seed: false,
  last_synced_at: "2026-08-29T12:00:00.000Z",
  ...extra,
});

/** Db falsa con upsert por github_repo_id y update de status. */
function fakeDb(inicial: RepoRow[] = []) {
  const store = new Map<number, RepoRow>(inicial.map((r) => [r.github_repo_id, r]));
  const db = {
    from: () => ({
      upsert: (rows: RepoRow[], opts: { onConflict: string }) => {
        expect(opts.onConflict).toBe("github_repo_id");
        for (const row of rows) store.set(row.github_repo_id, row);
        return Promise.resolve({ error: null });
      },
      update: (patch: Partial<RepoRow>) => ({
        eq: (_col: string, owner: string) => ({
          in: (_c: string, ids: number[]) => {
            for (const id of ids) {
              const row = store.get(id);
              if (row && row.owner_profile_id === owner) store.set(id, { ...row, ...patch });
            }
            return Promise.resolve({ error: null });
          },
        }),
      }),
    }),
  } as unknown as Db;
  return { db, store };
}

afterEach(() => {
  delete process.env.REPO_SELECTION_LIMIT;
});

describe("selectionLimit", () => {
  it("M-02: por defecto 5, configurable por REPO_SELECTION_LIMIT sin tocar código", () => {
    expect(selectionLimit()).toBe(5);
    process.env.REPO_SELECTION_LIMIT = "8";
    expect(selectionLimit()).toBe(8);
    process.env.REPO_SELECTION_LIMIT = "no-numero";
    expect(selectionLimit()).toBe(5);
  });
});

describe("computeSelectionDiff", () => {
  it("M-03: separa añadidos, quitados y conservados", () => {
    const current = [fila(1), fila(2), fila(3)];
    const diff = computeSelectionDiff(current, ["polmarza/repo-2", "polmarza/repo-3", "polmarza/repo-9"]);
    expect(diff.toAdd).toEqual(["polmarza/repo-9"]);
    expect(diff.toRemove.map((r) => r.github_repo_id)).toEqual([1]);
    expect(diff.kept).toBe(2);
  });
});

describe("validateSelectionSize", () => {
  it("M-02 (negativo): el sexto repo se rechaza en servidor", () => {
    const current = [fila(1), fila(2), fila(3), fila(4), fila(5)];
    const nombres = current.map((r) => r.full_name);
    const diff = computeSelectionDiff(current, [...nombres, "polmarza/repo-6"]);
    expect(() => validateSelectionSize(diff, 5)).toThrow(SelectionLimitError);
  });

  it("M-03: cambiar uno por otro dentro del límite es válido", () => {
    const current = [fila(1), fila(2), fila(3), fila(4), fila(5)];
    const nombres = current.slice(1).map((r) => r.full_name); // quita el 1
    const diff = computeSelectionDiff(current, [...nombres, "polmarza/repo-6"]);
    expect(() => validateSelectionSize(diff, 5)).not.toThrow();
  });
});

describe("importOwnedRepos / removeOwnedRepos", () => {
  it("M-02: importar no duplica por github_repo_id y reclama una semilla existente", async () => {
    const semilla = fila(7, { owner_profile_id: null, is_seed: true, owner_login: "otro" });
    const { db, store } = fakeDb([semilla]);

    await importOwnedRepos(db, [fila(7), fila(8)]);

    expect(store.size).toBe(2);
    expect(store.get(7)?.owner_profile_id).toBe("perfil-pol"); // reclamada
    expect(store.get(7)?.is_seed).toBe(false);
  });

  it("M-03: quitar pasa a removed sin borrar, y re-importar reactiva", async () => {
    const { db, store } = fakeDb([fila(1)]);

    await removeOwnedRepos(db, "perfil-pol", [1]);
    expect(store.get(1)?.status).toBe("removed");
    expect(store.size).toBe(1); // no se borra

    await importOwnedRepos(db, [fila(1)]);
    expect(store.get(1)?.status).toBe("active");
  });

  it("M-03: quitar solo afecta a los repos del propio perfil", async () => {
    const ajeno = fila(2, { owner_profile_id: "otra-persona" });
    const { db, store } = fakeDb([fila(1), ajeno]);

    await removeOwnedRepos(db, "perfil-pol", [1, 2]);
    expect(store.get(1)?.status).toBe("removed");
    expect(store.get(2)?.status).toBe("active");
  });
});
