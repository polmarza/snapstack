import { describe, it, expect, afterEach } from "vitest";
import type { Db } from "./client";
import type { RepoRow } from "./repos";
import {
  computeSelectionDiff,
  validateSelectionSize,
  selectionLimit,
  SelectionLimitError,
  RepoOwnedByAnotherProfileError,
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

/**
 * Db falsa con la semántica real de la tabla: lectura de propiedad, insert que
 * respeta la restricción única, y update con sus filtros (incluido el `or` que
 * limita a quién puede escribir la fila).
 */
function fakeDb(inicial: RepoRow[] = []) {
  const store = new Map<number, RepoRow>(inicial.map((r) => [r.github_repo_id, { ...r }]));

  const db = {
    from: () => ({
      select: () => ({
        in: (_col: string, ids: number[]) =>
          Promise.resolve({
            data: [...store.values()]
              .filter((row) => ids.includes(row.github_repo_id))
              .map((row) => ({
                github_repo_id: row.github_repo_id,
                owner_profile_id: row.owner_profile_id,
              })),
            error: null,
          }),
      }),
      insert: (rows: RepoRow[]) => {
        for (const row of rows) {
          if (store.has(row.github_repo_id)) {
            return Promise.resolve({ error: { message: "duplicate key value" } });
          }
          store.set(row.github_repo_id, { ...row });
        }
        return Promise.resolve({ error: null });
      },
      update: (patch: Partial<RepoRow>) => {
        let ids: number[] | null = null;
        let ownerEq: string | null = null;
        let ownerNullOrEq: string | null = null;

        const aplicar = () => {
          for (const [id, row] of store) {
            if (ids && !ids.includes(id)) continue;
            if (ownerEq !== null && row.owner_profile_id !== ownerEq) continue;
            if (
              ownerNullOrEq !== null &&
              row.owner_profile_id !== null &&
              row.owner_profile_id !== ownerNullOrEq
            ) {
              continue;
            }
            store.set(id, { ...row, ...patch });
          }
          return { error: null };
        };

        const builder = {
          eq: (col: string, value: string | number) => {
            if (col === "github_repo_id") ids = [Number(value)];
            if (col === "owner_profile_id") ownerEq = String(value);
            return builder;
          },
          in: (_col: string, valores: number[]) => {
            ids = valores;
            return builder;
          },
          or: (expr: string) => {
            const m = expr.match(/owner_profile_id\.is\.null,owner_profile_id\.eq\.(.+)$/);
            if (m) ownerNullOrEq = m[1];
            return builder;
          },
          then: (resolve: (v: { error: null }) => void) => resolve(aplicar()),
        };
        return builder;
      },
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

describe("importOwnedRepos", () => {
  it("M-02: importar no duplica por github_repo_id y reclama una semilla sin dueño", async () => {
    const semilla = fila(7, { owner_profile_id: null, is_seed: true, owner_login: "otro" });
    const { db, store } = fakeDb([semilla]);

    await importOwnedRepos(db, [fila(7), fila(8)], "perfil-pol");

    expect(store.size).toBe(2);
    expect(store.get(7)?.owner_profile_id).toBe("perfil-pol"); // reclamada
    expect(store.get(7)?.is_seed).toBe(false);
  });

  it("seguridad: no roba un repo que ya pertenece a otro perfil", async () => {
    const deOtro = fila(9, { owner_profile_id: "perfil-ajeno", full_name: "otra/cosa" });
    const { db, store } = fakeDb([deOtro]);

    await expect(importOwnedRepos(db, [fila(9)], "perfil-pol")).rejects.toThrow(
      RepoOwnedByAnotherProfileError,
    );
    expect(store.get(9)?.owner_profile_id).toBe("perfil-ajeno"); // intacto
  });

  it("seguridad: el intento sobre un repo ajeno no escribe tampoco los del mismo lote", async () => {
    const deOtro = fila(9, { owner_profile_id: "perfil-ajeno" });
    const { db, store } = fakeDb([deOtro]);

    await expect(importOwnedRepos(db, [fila(1), fila(9)], "perfil-pol")).rejects.toThrow();
    expect(store.has(1)).toBe(false);
  });

  it("M-03: re-importar un repo propio lo refresca sin problema", async () => {
    const { db, store } = fakeDb([fila(1, { stars: 1 })]);
    await importOwnedRepos(db, [fila(1, { stars: 42 })], "perfil-pol");
    expect(store.get(1)?.stars).toBe(42);
    expect(store.size).toBe(1);
  });
});

describe("removeOwnedRepos", () => {
  it("M-03: quitar pasa a removed sin borrar, y re-importar reactiva", async () => {
    const { db, store } = fakeDb([fila(1)]);

    await removeOwnedRepos(db, "perfil-pol", [1]);
    expect(store.get(1)?.status).toBe("removed");
    expect(store.size).toBe(1); // no se borra

    await importOwnedRepos(db, [fila(1)], "perfil-pol");
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
