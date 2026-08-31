import { describe, it, expect } from "vitest";
import type { Db } from "./client";
import {
  createFollowNotification,
  countUnreadNotifications,
  listNotifications,
  markAllNotificationsRead,
  notifyNewNote,
  notifyRepoUpdate,
  type NotificationRow,
  type RepoUpdatePayload,
} from "./notifications";

/** Db falsa de notifications: insert, filtros eq/is, count head y update. */
function fakeDb() {
  const rows: NotificationRow[] = [];
  let nextId = 1;
  const db = {
    from: (table: string) => {
      expect(table).toBe("notifications");
      const makeQuery = () => {
        let filtered = [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at));
        let counting = false;
        const query = {
          select: (_cols?: string, opts?: { count?: string; head?: boolean }) => {
            counting = Boolean(opts?.head);
            return query;
          },
          insert: (row: Partial<NotificationRow>) => {
            rows.push({
              id: `n${nextId}`,
              recipient_profile_id: row.recipient_profile_id as string,
              actor_profile_id: row.actor_profile_id ?? null,
              type: row.type ?? "new_follower",
              payload: row.payload ?? {},
              created_at: new Date(Date.UTC(2026, 7, 29, 12, 0, nextId)).toISOString(),
              read_at: null,
            });
            nextId++;
            return Promise.resolve({ error: null });
          },
          update: (patch: Partial<NotificationRow>) => {
            const upd = {
              eq: (col: string, v: string) => {
                if (col === "id") {
                  // Acumulación de repo_update: update por id.
                  const target = rows.find((r) => r.id === v);
                  if (target) {
                    if (patch.payload) target.payload = patch.payload;
                    if (patch.created_at) target.created_at = patch.created_at;
                  }
                  return Promise.resolve({ error: null });
                }
                return {
                  is: () => {
                    for (const r of rows) {
                      if (r.recipient_profile_id === v && r.read_at === null) {
                        r.read_at = patch.read_at ?? null;
                      }
                    }
                    return Promise.resolve({ error: null });
                  },
                };
              },
            };
            return upd;
          },
          eq: (col: string, v: string) => {
            filtered = filtered.filter((r) =>
              col === "payload->>repo_id"
                ? String((r.payload as { repo_id?: string }).repo_id) === v
                : r[col as keyof NotificationRow] === v,
            );
            return query;
          },
          is: () => {
            filtered = filtered.filter((r) => r.read_at === null);
            return query;
          },
          order: () => query,
          limit: (n: number) => {
            filtered = filtered.slice(0, n);
            return query;
          },
          maybeSingle: () => Promise.resolve({ data: filtered[0] ?? null, error: null }),
          then: (
            resolve: (v: { data: NotificationRow[]; count: number; error: null }) => void,
          ) => resolve({ data: counting ? [] : filtered, count: filtered.length, error: null }),
        };
        return query;
      };
      return makeQuery();
    },
  } as unknown as Db;
  return { db, rows };
}

describe("createFollowNotification", () => {
  it("C-04: seguir crea la notificación para el seguido", async () => {
    const { db, rows } = fakeDb();
    expect(await createFollowNotification(db, "pol", "ana")).toBe(true);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      recipient_profile_id: "pol",
      actor_profile_id: "ana",
      type: "new_follower",
      read_at: null,
    });
  });

  it("C-04: dejar de seguir y volver a seguir no notifica otra vez (anti-spam)", async () => {
    const { db, rows } = fakeDb();
    expect(await createFollowNotification(db, "pol", "ana")).toBe(true);
    expect(await createFollowNotification(db, "pol", "ana")).toBe(false);
    expect(rows).toHaveLength(1);
  });

  it("C-04: nadie se notifica a sí mismo", async () => {
    const { db, rows } = fakeDb();
    expect(await createFollowNotification(db, "pol", "pol")).toBe(false);
    expect(rows).toHaveLength(0);
  });
});

describe("contadores y lectura", () => {
  it("C-04: el badge cuenta solo las no leídas del destinatario", async () => {
    const { db } = fakeDb();
    await createFollowNotification(db, "pol", "ana");
    await createFollowNotification(db, "pol", "bea");
    await createFollowNotification(db, "otro", "ana");
    expect(await countUnreadNotifications(db, "pol")).toBe(2);
    expect(await countUnreadNotifications(db, "otro")).toBe(1);
    expect(await countUnreadNotifications(db, "nadie")).toBe(0);
  });

  it("C-04: abrir la página marca todo leído y el badge queda a cero", async () => {
    const { db } = fakeDb();
    await createFollowNotification(db, "pol", "ana");
    await createFollowNotification(db, "pol", "bea");
    await markAllNotificationsRead(db, "pol");
    expect(await countUnreadNotifications(db, "pol")).toBe(0);
    // Las notificaciones no desaparecen: siguen en el listado, ya leídas.
    const lista = await listNotifications(db, "pol");
    expect(lista).toHaveLength(2);
    expect(lista.every((n) => n.read_at !== null)).toBe(true);
  });

  it("C-04: el listado es del destinatario, más recientes primero", async () => {
    const { db } = fakeDb();
    await createFollowNotification(db, "pol", "ana");
    await createFollowNotification(db, "pol", "bea");
    await createFollowNotification(db, "otro", "cris");
    const lista = await listNotifications(db, "pol");
    expect(lista.map((n) => n.actor_profile_id)).toEqual(["bea", "ana"]);
  });
});

describe("notifyRepoUpdate (C-06)", () => {
  const push = (commits: number, compare = "https://github.com/a/b/compare/x...y"): RepoUpdatePayload => ({
    repo_id: "repo1",
    full_name: "a/b",
    commits,
    compare,
    ref: "refs/heads/main",
  });

  it("un push crea la notificación con su payload", async () => {
    const { db, rows } = fakeDb();
    await notifyRepoUpdate(db, "pol", push(3));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ type: "repo_update", recipient_profile_id: "pol" });
    expect(rows[0].payload).toMatchObject({ commits: 3, full_name: "a/b" });
  });

  it("anti-ruido: pushes sobre una no leída se acumulan (suma commits, compare más reciente)", async () => {
    const { db, rows } = fakeDb();
    await notifyRepoUpdate(db, "pol", push(3));
    await notifyRepoUpdate(db, "pol", push(2, "https://github.com/a/b/compare/y...z"));
    expect(rows).toHaveLength(1);
    expect(rows[0].payload).toMatchObject({
      commits: 5,
      compare: "https://github.com/a/b/compare/y...z",
    });
  });

  it("tras leerla, el siguiente push abre notificación nueva; otros repos no se mezclan", async () => {
    const { db, rows } = fakeDb();
    await notifyRepoUpdate(db, "pol", push(1));
    await markAllNotificationsRead(db, "pol");
    await notifyRepoUpdate(db, "pol", push(4));
    expect(rows).toHaveLength(2);

    await notifyRepoUpdate(db, "pol", { ...push(7), repo_id: "repo2", full_name: "c/d" });
    expect(rows).toHaveLength(3);
    expect(await countUnreadNotifications(db, "pol")).toBe(2);
  });
});

describe("notifyNewNote (C-09)", () => {
  const nota = {
    note_id: "nota-1",
    repo_id: "repo-1",
    full_name: "dev/repo-1",
    excerpt: "he arreglado el bug raro",
  };

  it("avisa al suscriptor con el recorte, para leerla sin abrirla", async () => {
    const { db } = fakeDb();
    expect(await notifyNewNote(db, "suscriptor", "autor", nota)).toBe(true);
    const [n] = await listNotifications(db, "suscriptor");
    expect(n.type).toBe("new_note");
    expect(n.actor_profile_id).toBe("autor");
    expect(n.payload).toMatchObject({ note_id: "nota-1", excerpt: "he arreglado el bug raro" });
  });

  it("el autor no se avisa a sí mismo", async () => {
    const { db } = fakeDb();
    expect(await notifyNewNote(db, "autor", "autor", nota)).toBe(false);
    expect(await countUnreadNotifications(db, "autor")).toBe(0);
  });

  it("dos notas del mismo repo son dos avisos: a diferencia de los pushes, no se funden", async () => {
    const { db } = fakeDb();
    await notifyNewNote(db, "suscriptor", "autor", nota);
    await notifyNewNote(db, "suscriptor", "autor", { ...nota, note_id: "nota-2", excerpt: "y otra cosa" });
    expect(await countUnreadNotifications(db, "suscriptor")).toBe(2);
  });
});
