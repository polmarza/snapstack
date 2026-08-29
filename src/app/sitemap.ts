import type { MetadataRoute } from "next";
import { createServiceClient } from "@/lib/db/client";

export const dynamic = "force-dynamic";

/**
 * Home + un perfil público por dev con repos. Si la base no responde, se
 * devuelve solo la home: un sitemap incompleto es mejor que un 500.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const home = { url: base, lastModified: new Date() };

  try {
    const db = createServiceClient();
    const { data, error } = await db
      .from("repos")
      .select("owner_login, last_synced_at")
      .eq("status", "active")
      .not("owner_profile_id", "is", null);
    if (error) return [home];

    const perfiles = new Map<string, string>();
    for (const row of (data ?? []) as Array<{ owner_login: string | null; last_synced_at: string }>) {
      if (!row.owner_login) continue;
      const previo = perfiles.get(row.owner_login);
      if (!previo || row.last_synced_at > previo) perfiles.set(row.owner_login, row.last_synced_at);
    }

    return [
      home,
      ...[...perfiles].map(([login, lastModified]) => ({
        url: `${base}/u/${login}`,
        lastModified: new Date(lastModified),
      })),
    ];
  } catch {
    return [home];
  }
}
