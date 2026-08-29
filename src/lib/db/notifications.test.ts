import { describe, it, expect } from "vitest";
import type { Db } from "./client";
import {
  createFollowNotification,
  countUnreadNotifications,
  listNotifications,
  markAllNotificationsRead,
  type NotificationRow,
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
              type: "new_follower",
              payload: {},
              created_at: new Date(Date.UTC(2026, 7, 29, 12, 0, nextId)).toISOString(),
              read_at: null,
            });
            nextId++;
            return Promise.resolve({ error: null });
          },
          update: (patch: Partial<NotificationRow>) => {
            const upd = {
              eq: (_c: string, v: string) => ({
                is: () => {
                  for (const r of rows) {
                    if (r.recipient_profile_id === v && r.read_at === null) {
                      r.read_at = patch.read_at ?? null;
                    }
                  }
                  return Promise.resolve({ error: null });
                },
              }),
            };
            return upd;
          },
          eq: (col: string, v: string) => {
            filtered = filtered.filter((r) => r[col as keyof NotificationRow] === v);
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
