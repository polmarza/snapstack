import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { auth } from "@clerk/nextjs/server";
import { buildAuthorizeUrl, githubAppConfigured } from "@/lib/github/app-oauth";

export const dynamic = "force-dynamic";

/**
 * Arranque del OAuth de la GitHub App (C-07). El state anti-CSRF viaja en una
 * cookie httpOnly; `from` (adónde volver) solo se acepta relativo.
 */
export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.redirect(new URL("/", request.url));
  if (!githubAppConfigured()) {
    return NextResponse.json({ error: "GitHub App not configured" }, { status: 503 });
  }

  const url = new URL(request.url);
  const from = url.searchParams.get("from") ?? "/";
  const returnTo = from.startsWith("/") && !from.startsWith("//") ? from : "/";

  const state = randomBytes(24).toString("hex");
  const jar = await cookies();
  const cookieOpts = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/", maxAge: 600 };
  jar.set("gh_oauth_state", state, cookieOpts);
  jar.set("gh_oauth_return", returnTo, cookieOpts);

  const base = process.env.NEXT_PUBLIC_APP_URL ?? url.origin;
  return NextResponse.redirect(buildAuthorizeUrl(state, `${base}/api/github/callback`));
}
