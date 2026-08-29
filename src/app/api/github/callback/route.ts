import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { timingSafeEqual } from "node:crypto";
import { auth } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/db/client";
import { saveGithubAppTokens } from "@/lib/db/github-app-tokens";
import { getProfileByClerkId } from "@/lib/db/profiles";
import { exchangeCode } from "@/lib/github/app-oauth";

export const dynamic = "force-dynamic";

const sameState = (a: string, b: string) => {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
};

/** Vuelta del OAuth de la App (C-07): verifica el state, canjea y guarda cifrado. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const jar = await cookies();
  const expectedState = jar.get("gh_oauth_state")?.value ?? "";
  const returnTo = jar.get("gh_oauth_return")?.value ?? "/";
  jar.delete("gh_oauth_state");
  jar.delete("gh_oauth_return");

  const fail = (reason: string) => {
    console.error(`[github/callback] ${reason}`);
    return NextResponse.redirect(new URL(returnTo.startsWith("/") ? returnTo : "/", url.origin));
  };

  try {
    const { userId } = await auth();
    if (!userId) return fail("sin sesión");

    const state = url.searchParams.get("state") ?? "";
    const code = url.searchParams.get("code") ?? "";
    if (!expectedState || !state || !sameState(state, expectedState)) return fail("state inválido");
    if (!code) return fail("sin code");

    const db = createServiceClient();
    const profile = await getProfileByClerkId(db, userId);
    if (!profile) return fail("sin perfil");

    const tokens = await exchangeCode(code);
    await saveGithubAppTokens(db, profile.id, tokens);
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
  return NextResponse.redirect(new URL(returnTo.startsWith("/") ? returnTo : "/", url.origin));
}
