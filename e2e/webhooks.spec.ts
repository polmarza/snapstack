import { test, expect, request as playwrightRequest } from "@playwright/test";
import { createHmac } from "node:crypto";

/**
 * M-08 contra el server real y la base local: payloads firmados con el secret
 * de .env.local, igual que los firmaría GitHub.
 */

process.loadEnvFile(".env.local");
const SECRET = process.env.GITHUB_WEBHOOK_SECRET ?? "";

const firmar = (body: string) => `sha256=${createHmac("sha256", SECRET).update(body).digest("hex")}`;

async function enviar(eventName: string, payload: unknown, firma?: string) {
  const api = await playwrightRequest.newContext({ baseURL: "http://localhost:3000" });
  const body = JSON.stringify(payload);
  const res = await api.post("/api/webhooks/github", {
    headers: {
      "Content-Type": "application/json",
      "X-GitHub-Event": eventName,
      "X-Hub-Signature-256": firma ?? firmar(body),
    },
    data: body,
  });
  return res;
}

interface FeedRepoLite {
  github_repo_id: number;
  full_name: string;
  url: string;
  stars: number;
  is_seed: boolean;
}

/**
 * El feed completo, vuelta entera de cursores: con el orden aleatorio (ficha
 * feed-orden-aleatorio) ninguna ficha tiene garantizada la primera página.
 */
async function feedCompleto(): Promise<FeedRepoLite[]> {
  const api = await playwrightRequest.newContext({ baseURL: "http://localhost:3000" });
  const repos: FeedRepoLite[] = [];
  let cursor: string | null = null;
  do {
    const url = cursor ? `/api/feed?cursor=${encodeURIComponent(cursor)}` : "/api/feed";
    const page = (await (await api.get(url)).json()) as {
      repos: FeedRepoLite[];
      nextCursor: string | null;
    };
    repos.push(...page.repos);
    cursor = page.nextCursor;
  } while (cursor);
  return repos;
}

/** Un repo semilla cualquiera del feed, para no tocar los de Pol. */
async function repoSemilla() {
  const seed = (await feedCompleto()).find((r) => r.is_seed);
  expect(seed).toBeTruthy();
  return seed as FeedRepoLite;
}

test("una firma inválida devuelve 401 y no toca nada", async () => {
  const res = await enviar("push", { repository: { id: 1 } }, "sha256=mala");
  expect(res.status()).toBe(401);
});

test("un evento star firmado cambia las stars que sirve el feed", async () => {
  const repo = await repoSemilla();
  const nuevasStars = 54321;

  const res = await enviar("star", {
    repository: {
      id: repo.github_repo_id,
      full_name: repo.full_name,
      description: null,
      html_url: repo.url,
      language: null,
      stargazers_count: nuevasStars,
    },
  });
  expect(res.status()).toBe(200);

  const actualizado = (await feedCompleto()).find((r) => r.github_repo_id === repo.github_repo_id);
  expect(actualizado?.stars).toBe(nuevasStars);
});

test("repository.privatized hace desaparecer la ficha del feed (sin fantasmas), y publicized la devuelve", async () => {
  const repo = await repoSemilla();
  const payload = {
    repository: {
      id: repo.github_repo_id,
      full_name: repo.full_name,
      description: null,
      html_url: repo.url,
      language: null,
      stargazers_count: repo.stars,
    },
  };

  const enFeed = async () =>
    (await feedCompleto()).some((r) => r.github_repo_id === repo.github_repo_id);

  expect((await enviar("repository", { action: "privatized", ...payload })).status()).toBe(200);
  expect(await enFeed()).toBe(false); // sin fantasmas

  // Restaurar: publicized reactiva.
  expect((await enviar("repository", { action: "publicized", ...payload })).status()).toBe(200);
  expect(await enFeed()).toBe(true);
});

test("C-06: un push firmado notifica a los suscriptores del repo, con acumulación", async () => {
  process.loadEnvFile(".env.local");
  const { createClient } = await import("@supabase/supabase-js");
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  );

  // Suscribir el perfil local de polmarza a un repo semilla.
  const repo = await repoSemilla();
  const { data: perfil } = await db.from("profiles").select("id").eq("username", "polmarza").single();
  const profileId = (perfil as { id: string }).id;
  const { data: fila } = await db.from("repos").select("id").eq("github_repo_id", repo.github_repo_id).single();
  const repoId = (fila as { id: string }).id;
  // Estado limpio: sin suscripción previa ni notificaciones de este repo.
  await db.from("repo_subscriptions").delete().eq("subscriber_profile_id", profileId).eq("repo_id", repoId);
  await db.from("notifications").delete().eq("recipient_profile_id", profileId).eq("type", "repo_update");
  await db.from("repo_subscriptions").insert({ subscriber_profile_id: profileId, repo_id: repoId });

  const push = (commits: number, compare: string) => ({
    ref: "refs/heads/main",
    compare,
    commits: Array.from({ length: commits }, (_, i) => ({ id: `c${i}` })),
    repository: {
      id: repo.github_repo_id,
      full_name: repo.full_name,
      description: null,
      html_url: repo.url,
      language: null,
      stargazers_count: repo.stars,
    },
  });

  const notificaciones = async () => {
    const { data } = await db
      .from("notifications")
      .select("payload, read_at")
      .eq("recipient_profile_id", profileId)
      .eq("type", "repo_update");
    return (data ?? []) as Array<{ payload: { commits: number; compare: string }; read_at: string | null }>;
  };

  // Primer push: crea la notificación.
  expect((await enviar("push", push(3, "https://github.com/x/compare/a...b"))).status()).toBe(200);
  let filas = await notificaciones();
  expect(filas).toHaveLength(1);
  expect(filas[0].payload.commits).toBe(3);

  // Segundo push sin leer: acumula en la misma, no apila.
  expect((await enviar("push", push(2, "https://github.com/x/compare/b...c"))).status()).toBe(200);
  filas = await notificaciones();
  expect(filas).toHaveLength(1);
  expect(filas[0].payload.commits).toBe(5);
  expect(filas[0].payload.compare).toBe("https://github.com/x/compare/b...c");

  // Limpieza: la suscripción no debe interferir con otras pasadas.
  await db.from("repo_subscriptions").delete().eq("subscriber_profile_id", profileId).eq("repo_id", repoId);
  await db.from("notifications").delete().eq("recipient_profile_id", profileId).eq("type", "repo_update");
});

test("C-08: el evento installation firmado registra y retira la instalación del perfil", async () => {
  process.loadEnvFile(".env.local");
  const { createClient } = await import("@supabase/supabase-js");
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  );
  const { data } = await db.from("profiles").select("id, github_id").eq("username", "polmarza").single();
  const perfil = data as { id: string; github_id: number };
  expect(perfil.github_id).toBeTruthy();

  const instalacion = async () => {
    const { data: fila } = await db
      .from("profiles")
      .select("github_installation_id")
      .eq("id", perfil.id)
      .single();
    return (fila as { github_installation_id: number | null }).github_installation_id;
  };

  const payload = (action: string) => ({
    action,
    installation: { id: 424242, account: { id: perfil.github_id } },
  });

  expect((await enviar("installation", payload("created"))).status()).toBe(200);
  expect(await instalacion()).toBe(424242);

  expect((await enviar("installation", payload("deleted"))).status()).toBe(200);
  expect(await instalacion()).toBeNull();
});

test("C-08: installation_repositories registra la instalación (App ya instalada, repos cambiados)", async () => {
  process.loadEnvFile(".env.local");
  const { createClient } = await import("@supabase/supabase-js");
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  );
  const { data } = await db.from("profiles").select("id, github_id").eq("username", "polmarza").single();
  const perfil = data as { id: string; github_id: number };

  // Estado de partida: sin instalación registrada, como quien la instaló antes
  // de que existiera el handler.
  await db.from("profiles").update({ github_installation_id: null }).eq("id", perfil.id);

  const res = await enviar("installation_repositories", {
    action: "added",
    installation: { id: 515151, account: { id: perfil.github_id } },
    repositories_added: [],
  });
  expect(res.status()).toBe(200);

  const { data: fila } = await db
    .from("profiles")
    .select("github_installation_id")
    .eq("id", perfil.id)
    .single();
  expect((fila as { github_installation_id: number | null }).github_installation_id).toBe(515151);

  await db.from("profiles").update({ github_installation_id: null }).eq("id", perfil.id);
});
