/** Cliente mínimo del GraphQL de GitHub. El token nunca se loguea. */

const ENDPOINT = "https://api.github.com/graphql";

export class GithubGraphqlError extends Error {}

export async function githubGraphql<T>(
  token: string,
  query: string,
  variables: Record<string, unknown>,
  fetchImpl: typeof fetch = fetch,
): Promise<T> {
  const res = await fetchImpl(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new GithubGraphqlError(`GitHub GraphQL respondió ${res.status} ${res.statusText}`);
  }

  const payload = (await res.json()) as { data?: T; errors?: Array<{ message: string }> };
  if (payload.errors?.length) {
    throw new GithubGraphqlError(`GitHub GraphQL: ${payload.errors.map((e) => e.message).join("; ")}`);
  }
  if (!payload.data) throw new GithubGraphqlError("GitHub GraphQL: respuesta sin data");
  return payload.data;
}
