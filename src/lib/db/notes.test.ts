import { describe, it, expect } from "vitest";
import type { Db } from "./client";
import {
  createNote,
  deleteNote,
  normalizeNoteBody,
  validateNoteBody,
  NoteValidationError,
  NOTE_MAX_LENGTH,
} from "./notes";

interface RepoFila {
  id: string;
  owner_profile_id: string | null;
  status: string;
}

/**
 * Db falsa con las dos operaciones que hace `notes.ts`: leer el repo del ancla
 * e insertar/borrar la nota. Registra lo insertado y los filtros del borrado,
 * que es donde vive la autorización.
 */
function fakeDb(repos: RepoFila[], notas: Array<{ id: string; author_profile_id: string }> = []) {
  const insertadas: Array<Record<string, unknown>> = [];
  const db = {
    from: (table: string) => {
      if (table === "repos") {
        let fila: RepoFila | null = null;
        const query = {
          select: () => query,
          eq: (_c: string, v: string) => {
            fila = repos.find((r) => r.id === v) ?? null;
            return query;
          },
          maybeSingle: () => Promise.resolve({ data: fila, error: null }),
        };
        return query;
      }

      const filtros: Record<string, string> = {};
      let payload: Record<string, unknown> = {};
      const query = {
        insert: (row: Record<string, unknown>) => {
          payload = row;
          insertadas.push(row);
          return query;
        },
        delete: () => query,
        select: () => query,
        eq: (col: string, value: string) => {
          filtros[col] = value;
          return query;
        },
        single: () =>
          Promise.resolve({
            data: { id: "nota-1", created_at: "2026-08-31T10:00:00+00:00", ...payload },
            error: null,
          }),
        then: (resolve: (v: { data: unknown[]; error: null }) => void) => {
          // Borrado: solo cae la nota que cumple los dos filtros.
          const borradas = notas.filter(
            (n) => n.id === filtros.id && n.author_profile_id === filtros.author_profile_id,
          );
          resolve({ data: borradas, error: null });
        },
      };
      return query;
    },
  } as unknown as Db;
  return { db, insertadas };
}

describe("normalizeNoteBody", () => {
  it("recorta y colapsa los saltos de línea de más", () => {
    expect(normalizeNoteBody("  hola  ")).toBe("hola");
    expect(normalizeNoteBody("a\n\n\n\n\nb")).toBe("a\n\nb");
    expect(normalizeNoteBody("a\r\nb")).toBe("a\nb");
    // Un salto simple y uno doble son deliberados: se respetan.
    expect(normalizeNoteBody("a\nb\n\nc")).toBe("a\nb\n\nc");
  });

  it("una nota de puros saltos de línea no pasa: ocuparía media pantalla del feed", () => {
    expect(() => validateNoteBody("\n".repeat(400))).toThrow(NoteValidationError);
  });
});

describe("validateNoteBody", () => {
  it("rechaza el vacío y lo que solo son espacios", () => {
    expect(() => validateNoteBody("")).toThrow(NoteValidationError);
    expect(() => validateNoteBody("    ")).toThrow(NoteValidationError);
  });

  it(`rechaza por encima de ${NOTE_MAX_LENGTH} y acepta justo en el límite`, () => {
    expect(validateNoteBody("x".repeat(NOTE_MAX_LENGTH))).toHaveLength(NOTE_MAX_LENGTH);
    expect(() => validateNoteBody("x".repeat(NOTE_MAX_LENGTH + 1))).toThrow(NoteValidationError);
  });

  it("el recorte se aplica antes de medir: los espacios del final no gastan cuota", () => {
    expect(validateNoteBody(`${"x".repeat(NOTE_MAX_LENGTH)}   `)).toHaveLength(NOTE_MAX_LENGTH);
  });
});

describe("createNote — la regla del ancla", () => {
  const propio = { id: "repo-propio", owner_profile_id: "yo", status: "active" };
  const ajeno = { id: "repo-ajeno", owner_profile_id: "otro", status: "active" };
  const retirado = { id: "repo-retirado", owner_profile_id: "yo", status: "removed" };
  const semilla = { id: "repo-semilla", owner_profile_id: null, status: "active" };

  it("con un repo propio y activo, guarda la nota anclada y con el texto normalizado", async () => {
    const { db, insertadas } = fakeDb([propio]);
    const nota = await createNote(db, "yo", "repo-propio", "  he arreglado el bug raro  ");
    expect(nota.id).toBe("nota-1");
    expect(insertadas[0]).toMatchObject({
      author_profile_id: "yo",
      repo_id: "repo-propio",
      body: "he arreglado el bug raro",
    });
  });

  it("sobre un repo ajeno no se escribe: escribes sobre lo tuyo", async () => {
    const { db, insertadas } = fakeDb([ajeno]);
    await expect(createNote(db, "yo", "repo-ajeno", "hola")).rejects.toThrow(NoteValidationError);
    expect(insertadas).toHaveLength(0);
  });

  it("sobre un repo retirado tampoco: no habría dónde leer la nota", async () => {
    const { db, insertadas } = fakeDb([retirado]);
    await expect(createNote(db, "yo", "repo-retirado", "hola")).rejects.toThrow(NoteValidationError);
    expect(insertadas).toHaveLength(0);
  });

  it("sobre un repo semilla (sin dueño) tampoco", async () => {
    const { db } = fakeDb([semilla]);
    await expect(createNote(db, "yo", "repo-semilla", "hola")).rejects.toThrow(NoteValidationError);
  });

  it("sobre un repo que no existe tampoco, y sin decir si existía", async () => {
    const { db } = fakeDb([]);
    await expect(createNote(db, "yo", "repo-fantasma", "hola")).rejects.toThrow(
      "You can only write notes about your own active repos.",
    );
  });

  it("el cuerpo se valida antes de tocar la base", async () => {
    const { db, insertadas } = fakeDb([propio]);
    await expect(createNote(db, "yo", "repo-propio", "   ")).rejects.toThrow(NoteValidationError);
    expect(insertadas).toHaveLength(0);
  });
});

describe("deleteNote", () => {
  const notas = [{ id: "nota-1", author_profile_id: "yo" }];

  it("el autor borra la suya", async () => {
    const { db } = fakeDb([], notas);
    expect(await deleteNote(db, "yo", "nota-1")).toBe(true);
  });

  it("otro no borra la ajena: la autorización es el filtro de la consulta", async () => {
    const { db } = fakeDb([], notas);
    expect(await deleteNote(db, "otro", "nota-1")).toBe(false);
  });

  it("una nota que no existe devuelve false, sin distinguirse de la ajena", async () => {
    const { db } = fakeDb([], notas);
    expect(await deleteNote(db, "yo", "nota-fantasma")).toBe(false);
  });
});
