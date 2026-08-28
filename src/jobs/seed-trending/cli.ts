/**
 * Entrada del seed manual: pnpm seed:trending [--remote] [--days=N] [--limit=N]
 *
 * Por defecto solo acepta el Supabase local (supabase start). Contra el proyecto
 * remoto exige --remote explícito: sembrar producción es una decisión, no un default.
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
if (!isLocalSupabase() && !remote) {
  console.error(
    "NEXT_PUBLIC_SUPABASE_URL no apunta al stack local. " +
      "Si de verdad quieres sembrar el proyecto remoto, ejecuta con --remote.",
  );
  process.exit(1);
}

async function main() {
  const db = createServiceClient();
  const result = await runSeedTrending({
    db,
    days: flag("days") ? Number(flag("days")) : undefined,
    limit: flag("limit") ? Number(flag("limit")) : undefined,
    token: process.env.GITHUB_TOKEN,
  });

  console.log(`Importados ${result.imported} repos trending (${remote ? "REMOTO" : "local"}):`);
  for (const name of result.repos) console.log(`  - ${name}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
