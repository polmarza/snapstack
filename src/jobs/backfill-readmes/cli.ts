/**
 * Backfill de READMEs (C-05): pnpm backfill:readmes [--remote] [--limit=N]
 *
 * Rellena `repos.readme_md` donde falte (semillas incluidas) usando
 * GITHUB_TOKEN. Mismas salvaguardas que el seed: por defecto va contra el
 * Supabase local; el remoto exige --remote y las variables SUPABASE_REMOTE_*.
 * Un repo sin README (o rechazado por moderación) queda marcado con
 * `readme_fetched_at` para no repedirlo en cada pasada.
 */

import { createServiceClient, isLocalSupabase } from "@/lib/db/client";
import { fetchRepoReadme } from "@/lib/github/readme";

try {
  process.loadEnvFile(".env.local");
} catch {
  // Sin .env.local: valdrán las variables que ya tenga el entorno.
}

const args = process.argv.slice(2);
const flag = (name: string): string | undefined =>
  args.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];

const remote = args.includes("--remote");
if (!remote && !isLocalSupabase()) {
  console.error(
    "NEXT_PUBLIC_SUPABASE_URL no apunta al stack local. " +
      "Para el proyecto remoto, ejecuta con --remote (usa las SUPABASE_REMOTE_*).",
  );
  process.exit(1);
}
if (remote && !process.env.SUPABASE_REMOTE_URL) {
  console.error("Faltan SUPABASE_REMOTE_URL / SUPABASE_REMOTE_SERVICE_ROLE_KEY en .env.local.");
  process.exit(1);
}
// Como en el seed: el token (GITHUB_TOKEN, solo lectura pública) es opcional
// y sube el rate limit de 60/h a 5000/h. Sin él, pasadas cortas.
const token = process.env.GITHUB_TOKEN ?? null;
if (!token) console.log("Sin GITHUB_TOKEN: rate limit anónimo (60/h) — vale para pasadas cortas.");

async function main() {
  const db = remote
    ? createServiceClient(
        process.env.SUPABASE_REMOTE_URL,
        process.env.SUPABASE_REMOTE_SERVICE_ROLE_KEY,
      )
    : createServiceClient();
  const limit = flag("limit") ? Number(flag("limit")) : 100;

  const { data, error } = await db
    .from("repos")
    .select("github_repo_id, full_name")
    .eq("status", "active")
    .is("readme_fetched_at", null)
    .limit(limit);
  if (error) throw new Error(`Error al listar repos sin README: ${error.message}`);

  const pendientes = (data ?? []) as Array<{ github_repo_id: number; full_name: string }>;
  console.log(`${pendientes.length} repos sin README (${remote ? "REMOTO" : "local"}).`);

  let conReadme = 0;
  for (const repo of pendientes) {
    let readme: string | null = null;
    try {
      readme = await fetchRepoReadme(token, repo.full_name);
    } catch (err) {
      console.error(`  ✗ ${repo.full_name}: ${err instanceof Error ? err.message : err}`);
      continue; // sin marcar: la próxima pasada lo reintenta
    }
    const { error: updateError } = await db
      .from("repos")
      .update({ readme_md: readme, readme_fetched_at: new Date().toISOString() })
      .eq("github_repo_id", repo.github_repo_id);
    if (updateError) {
      console.error(`  ✗ ${repo.full_name}: ${updateError.message}`);
      continue;
    }
    if (readme) conReadme++;
    console.log(`  ${readme ? "✓" : "—"} ${repo.full_name}${readme ? "" : " (sin README o filtrado)"}`);
  }
  console.log(`Hecho: ${conReadme} READMEs guardados de ${pendientes.length} repos.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
