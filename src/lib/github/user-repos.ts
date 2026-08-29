/**
 * Listado e importación de repos públicos del usuario (M-02), con su token OAuth
 * (vía Clerk). La GitHub App llega con M-08; para un import puntual el token del
 * usuario basta y escala por usuario.
 */

import { cardSeed } from "@/lib/card-seed";
import type { RepoRow } from "@/lib/db/repos";
import { githubGraphql } from "./graphql";

/** Elemento de la lista de selección del onboarding/settings. */
export interface PublicRepoListItem {
  githubRepoId: number;
  fullName: string;
  name: string;
  description: string | null;
  primaryLanguage: string | null;
  stars: number;
}

interface ListResponse {
  viewer: {
    repositories: {
      nodes: Array<{
        databaseId: number;
        nameWithOwner: string;
        name: string;
        description: string | null;
        stargazerCount: number;
        isArchived: boolean;
        primaryLanguage: { name: string } | null;
      }>;
    };
  };
}

const LIST_QUERY = `
query($first: Int!) {
  viewer {
    repositories(first: $first, privacy: PUBLIC, isFork: false,
                 ownerAffiliations: [OWNER],
                 orderBy: { field: PUSHED_AT, direction: DESC }) {
      nodes {
        databaseId nameWithOwner name description stargazerCount isArchived
        primaryLanguage { name }
      }
    }
  }
}`;

/** Repos públicos propios, sin forks (decisión de ficha) ni archivados. */
export async function listPublicRepos(
  token: string,
  fetchImpl: typeof fetch = fetch,
): Promise<PublicRepoListItem[]> {
  const data = await githubGraphql<ListResponse>(token, LIST_QUERY, { first: 100 }, fetchImpl);
  return data.viewer.repositories.nodes
    .filter((node) => !node.isArchived)
    .map((node) => ({
      githubRepoId: node.databaseId,
      fullName: node.nameWithOwner,
      name: node.name,
      description: node.description,
      primaryLanguage: node.primaryLanguage?.name ?? null,
      stars: node.stargazerCount,
    }));
}

export interface RepoDetails {
  databaseId: number;
  nameWithOwner: string;
  description: string | null;
  url: string;
  stargazerCount: number;
  owner: { login: string; avatarUrl: string };
  languages: { edges: Array<{ size: number; node: { name: string } }> };
  repositoryTopics: { nodes: Array<{ topic: { name: string } }> };
}

const DETAILS_QUERY = `
query($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    databaseId nameWithOwner description url stargazerCount
    owner { login avatarUrl }
    languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
      edges { size node { name } }
    }
    repositoryTopics(first: 20) { nodes { topic { name } } }
  }
}`;

export async function fetchRepoDetails(
  token: string,
  fullName: string,
  fetchImpl: typeof fetch = fetch,
): Promise<RepoDetails> {
  const [owner, ...rest] = fullName.split("/");
  const data = await githubGraphql<{ repository: RepoDetails | null }>(
    token,
    DETAILS_QUERY,
    { owner, name: rest.join("/") },
    fetchImpl,
  );
  if (!data.repository) throw new Error(`El repo ${fullName} no existe o no es accesible`);
  return data.repository;
}

/** GraphQL → fila de `repos`, con dueño: `is_seed = false` (M-02). */
export function mapRepoDetailsToRow(details: RepoDetails, profileId: string, now: Date): RepoRow {
  const languages = Object.fromEntries(
    details.languages.edges.map((edge) => [edge.node.name, edge.size]),
  );
  const primary = details.languages.edges[0]?.node.name ?? null;

  return {
    github_repo_id: details.databaseId,
    owner_profile_id: profileId,
    owner_login: details.owner.login,
    owner_avatar_url: details.owner.avatarUrl,
    full_name: details.nameWithOwner,
    description: details.description,
    url: details.url,
    primary_language: primary,
    languages,
    topics: details.repositoryTopics.nodes.map((node) => node.topic.name),
    stars: details.stargazerCount,
    card_seed: cardSeed(String(details.databaseId)),
    status: "active",
    is_seed: false,
    last_synced_at: now.toISOString(),
  };
}
