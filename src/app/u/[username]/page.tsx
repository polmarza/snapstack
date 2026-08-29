import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Settings } from "lucide-react";
import { currentUser } from "@clerk/nextjs/server";
import { RepoCard } from "@/components/feed/repo-card";
import { FollowButton } from "@/components/follow/follow-button";
import { createServiceClient } from "@/lib/db/client";
import type { FeedRepo } from "@/lib/db/feed-page";
import { getFollowCounts, isFollowing } from "@/lib/db/follows";
import { getProfileByClerkId, getProfileByUsername } from "@/lib/db/profiles";
import { listOwnedActiveRepos } from "@/lib/db/selection";
import { SocialIconLinks } from "@/components/profile/social-icon-links";
import { parseStoredSocialLinks } from "@/lib/profile/social-links";

/**
 * Dinámica. Se intentó cachearla con ISR y no es posible tal como está: los
 * componentes cliente de la tarjeta (`FollowButton`, `CardMenu`) llaman a
 * `useAuth()`, y eso obliga a Next a renderizar la ruta bajo demanda por mucho
 * `revalidate` que se declare. Cachearla exigiría que esos botones no resuelvan
 * sesión durante el render del servidor (ver MEJORA-04 en `mejoras/backlog.md`).
 */
export const dynamic = "force-dynamic";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfileByUsername(createServiceClient(), username).catch(() => null);
  if (!profile) return { title: "Profile not found" };

  const name = profile.display_name ?? profile.username;
  const description = `What ${name} is building — their curated GitHub repos on snapstack.`;
  const og = new URLSearchParams({
    repoId: profile.username,
    name: profile.username,
    description: `${name} on snapstack — a curated selection of their repos`,
  });

  return {
    title: `${profile.username} · snapstack`,
    description,
    // Canónica: evita que /u/x?utm_source=… se indexe como página distinta.
    alternates: { canonical: `/u/${profile.username}` },
    openGraph: {
      type: "profile",
      siteName: "snapstack",
      url: `/u/${profile.username}`,
      title: `${profile.username} · snapstack`,
      description,
      images: [`/api/og?${og.toString()}`],
    },
  };
}

/**
 * JSON-LD del perfil. El nombre viene de GitHub (texto de terceros): se escapa
 * `<` para que no pueda cerrar la etiqueta <script>.
 */
function profileJsonLd(profile: {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  social_links?: unknown;
}) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const data = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: profile.display_name ?? profile.username,
      alternateName: profile.username,
      url: `${base}/u/${profile.username}`,
      ...(profile.avatar_url ? { image: profile.avatar_url } : {}),
      sameAs: [
        `https://github.com/${profile.username}`,
        ...Object.values(parseStoredSocialLinks(profile.social_links)),
      ],
    },
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const db = createServiceClient();
  const profile = await getProfileByUsername(db, username).catch(() => null);
  if (!profile) notFound();

  const repos = (await listOwnedActiveRepos(db, profile.id)) as FeedRepo[];
  repos.sort((a, b) => b.imported_at.localeCompare(a.imported_at));
  const counts = await getFollowCounts(db, profile.id);

  // Botón Follow: solo con sesión y sobre perfiles ajenos.
  const user = await currentUser();
  const viewer = user ? await getProfileByClerkId(db, user.id) : null;
  const canFollow = viewer !== null && viewer.id !== profile.id;
  const alreadyFollowing = canFollow ? await isFollowing(db, viewer.id, profile.id) : false;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: profileJsonLd(profile) }}
      />

      {/* Cabecera en tres niveles: quién es, qué cuenta de sí, y sus números
          con sus enlaces. Antes todo compartía una línea y nada destacaba. */}
      <header data-testid="profile-header" className="mb-8">
        <div className="flex items-start gap-4">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- avatar de GitHub, sin optimización
            <img
              src={profile.avatar_url}
              alt=""
              width={80}
              height={80}
              className="h-16 w-16 shrink-0 rounded-full border border-edge sm:h-20 sm:w-20"
            />
          ) : null}

          <div className="min-w-0 flex-1">
            <h1 className="truncate font-mono text-2xl font-bold sm:text-3xl">
              {profile.display_name ?? profile.username}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-content-secondary">
              <span data-testid="profile-username" className="font-mono">@{profile.username}</span>
              <a
                href={`https://github.com/${profile.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                GitHub ↗
              </a>
            </p>
            {profile.tagline ? (
              <p data-testid="profile-tagline" className="mt-2 text-base text-content">
                {profile.tagline}
              </p>
            ) : null}
          </div>

          {canFollow ? (
            <div className="shrink-0">
              <FollowButton profileId={profile.id} initialFollowing={alreadyFollowing} refreshOnToggle />
            </div>
          ) : viewer && viewer.id === profile.id ? (
            // Tu propio perfil: acceso a Settings desde aquí (en móvil es la
            // única puerta; la barra inferior ya no lo lleva).
            <div className="shrink-0">
              <Link
                href="/settings/account"
                data-testid="profile-edit-link"
                className="flex items-center gap-2 rounded-lg border border-edge px-3 py-2 text-sm text-content-secondary transition-colors hover:text-content sm:px-4"
              >
                <Settings size={16} strokeWidth={1.75} aria-hidden />
                <span className="hidden sm:inline">Edit profile</span>
              </Link>
            </div>
          ) : null}
        </div>

        {profile.bio ? (
          <p data-testid="profile-bio" className="mt-4 max-w-prose text-sm leading-relaxed text-content-secondary">
            {profile.bio}
          </p>
        ) : null}

        {/* Números y redes, separados por su propia línea: son datos, no
            identidad, y con la cifra en primer plano se leen de un vistazo. */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-edge pt-4">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-sm">
            <span>
              <span className="font-bold">{repos.length}</span>{" "}
              <span className="text-content-secondary">{repos.length === 1 ? "repo" : "repos"}</span>
            </span>
            <span data-testid="profile-follow-counts">
              <span className="font-bold">{counts.followers}</span>{" "}
              <span className="text-content-secondary">
                {counts.followers === 1 ? "follower" : "followers"}
              </span>
              <span className="mx-2 text-content-secondary/50">·</span>
              <span className="font-bold">{counts.following}</span>{" "}
              <span className="text-content-secondary">following</span>
            </span>
          </div>
          <SocialIconLinks links={parseStoredSocialLinks(profile.social_links)} />
        </div>
      </header>

      {repos.length === 0 ? (
        <p data-testid="profile-empty" className="text-content-secondary">
          No repos selected yet.
        </p>
      ) : (
        // Una sola columna, como el feed: la tarjeta es la misma y sus
        // tamaños están pensados para este ancho (a dos columnas el texto
        // desbordaba y el menú de la esquina quedaba fuera).
        <div className="flex flex-col gap-6">
          {repos.map((repo) => (
            <RepoCard key={repo.id} repo={repo} showFooter={false} />
          ))}
        </div>
      )}
    </main>
  );
}
