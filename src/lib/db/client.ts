/**
 * Cliente de Supabase para el servidor (service role). Nunca importar desde
 * componentes de cliente: la service role key se salta RLS.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type Db = SupabaseClient;

export function createServiceClient(): Db {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno (ver .env.example).",
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

/** true si la URL de Supabase apunta al stack local (supabase start). */
export function isLocalSupabase(url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""): boolean {
  return /^https?:\/\/(127\.0\.0\.1|localhost)([:/]|$)/.test(url);
}
