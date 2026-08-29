/**
 * Entrada del seed manual: pnpm seed:trending [--remote] [--days=N] [--limit=N]
 *
 * Por defecto siembra el Supabase local (supabase start). Con --remote usa las
 * variables SUPABASE_REMOTE_URL / SUPABASE_REMOTE_SERVICE_ROLE_KEY: sembrar el
 * proyecto remoto es una decisión explícita, no un default.
 */

import { createServiceClient, isLocalSupabase } from "@/lib/db/client";
import { runSeedTrending } from "./run";

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
      "Para sembrar el proyecto remoto, ejecuta con --remote (usa las SUPABASE_REMOTE_*).",
  );
  process.exit(1);
}
if (remote && !process.env.SUPABASE_REMOTE_URL) {
  console.error("Faltan SUPABASE_REMOTE_URL / SUPABASE_REMOTE_SERVICE_ROLE_KEY en .env.local.");
  process.exit(1);
}

async function main() {
  const db = remote
    ? createServiceClient(
        process.env.SUPABASE_REMOTE_URL,
        process.env.SUPABASE_REMOTE_SERVICE_ROLE_KEY,
      )
    : createServiceClient();
  const result = await runSeedTrending({
    db,
    days: flag("days") ? Number(flag("days")) : undefined,
    limit: flag("limit") ? Number(flag("limit")) : undefined,
    token: process.env.GITHUB_TOKEN,
  });

  console.log(`Importados ${result.imported} repos trending (${remote ? "REMOTO" : "local"}):`);
  for (const name of result.repos) console.log(`  - ${name}`);
  if (result.discarded > 0) {
    console.log(`Descartados por el filtro de contenido: ${result.discarded}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
