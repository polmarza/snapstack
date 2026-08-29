import { clerkClient } from "@clerk/nextjs/server";

/**
 * Token OAuth de GitHub del usuario, gestionado por Clerk. Solo servidor; el
 * valor nunca se loguea ni viaja al cliente.
 */
export async function getGithubToken(clerkUserId: string): Promise<string | null> {
  const client = await clerkClient();
  const res = await client.users.getUserOauthAccessToken(clerkUserId, "github");
  const token = res.data?.[0]?.token;
  return token && token.length > 0 ? token : null;
}
