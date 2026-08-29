import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { AuthControls } from "@/components/auth/auth-controls";
import { FeedList } from "@/components/feed/feed-list";
import { RepoCard } from "@/components/feed/repo-card";
import { Faq } from "@/components/landing/faq";
import { HeroCardsBackground } from "@/components/landing/hero-cards-background";
import { HowItWorks } from "@/components/landing/how-it-works";
import { LandingCta } from "@/components/landing/landing-cta";
import { LanguageMarquee } from "@/components/landing/language-marquee";
import { RepoCardSkeleton } from "@/components/skeleton/skeleton";
import { createServiceClient } from "@/lib/db/client";
import { annotateFollowed, listFeedPage, type FeedPage } from "@/lib/db/feed-page";
import { listFollowedIds } from "@/lib/db/follows";
import { ensureProfile, getProfileByClerkId } from "@/lib/db/profiles";

export const dynamic = "force-dynamic";

const TAGLINE = "What devs are building, repo by repo.";

/**
 * La home es el enlace que más se comparte: sin Open Graph propio, snapstack.sh
 * se pega como un enlace pelado. La portada usa el mismo endpoint de fichas.
 */
export const metadata: Metadata = {
  title: "snapstack — what devs are building",
  description:
    "A curated profile for your GitHub repos + a visual feed to discover what other devs are building.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "snapstack",
    title: "snapstack — what devs are building",
    description: TAGLINE,
    // La portada es una captura real del hero (1200x630, misma imagen que la
    // cabecera del README): la versión procedural de /api/og/home quedaba
    // recortada y con el texto pisando las tarjetas.
    images: ["/og-home.png"],
  },
};

interface HomeProps {
  searchParams: Promise<{ filter?: string }>;
}

/**
 * El cuerpo del feed con sesión, como componente propio: vive dentro de un
 * <Suspense key={pestaña}> para que cambiar entre All y Following enseñe el
 * esqueleto mientras carga (loading.tsx no se re-dispara cuando solo cambian
 * los searchParams de la misma ruta).
 */
async function FeedBody({
  followingView,
  followedIds,
  viewerProfileId,
}: {
  followingView: boolean;
  followedIds: string[];
  viewerProfileId: string | null;
}) {
  let page: FeedPage | null = null;
  try {
    const db = createServiceClient();
    page = await listFeedPage(db, null, undefined, followingView ? { ownerIn: followedIds } : {});
    page = annotateFollowed(page, new Set(followedIds), viewerProfileId);
  } catch {
    page = null;
  }

  if (page === null) {
    return (
      <p data-testid="feed-unavailable" className="text-error">
        The feed is unavailable right now. Check back soon.
      </p>
    );
  }
  if (page.repos.length === 0) {
    return (
      <p data-testid="feed-empty" className="text-content-secondary">
        {followingView
          ? "You're not following anyone yet. Explore the feed and follow the devs you like."
          : "No repos in the feed yet."}
      </p>
    );
  }
  return (
    <FeedList
      key={followingView ? "following" : "all"}
      initialRepos={page.repos}
      initialCursor={page.nextCursor}
      filter={followingView ? "following" : undefined}
    />
  );
}

function FeedBodySkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden>
      <RepoCardSkeleton />
      <RepoCardSkeleton />
    </div>
  );
}

export default async function Home({ searchParams }: HomeProps) {
  const { filter } = await searchParams;

  let page: FeedPage | null = null;
  let signedIn = false;
  let sessionOk = true;
  let needsOnboarding = false;
  let viewerProfileId: string | null = null;
  let followedIds: string[] = [];
  try {
    const db = createServiceClient();
    const user = await currentUser();
    // Primer login → crea el perfil; siguientes → lo refresca. Sin sesión, no-op.
    await ensureProfile(db, user).catch(() => null);
    const profile = user ? await getProfileByClerkId(db, user.id) : null;
    signedIn = profile !== null;
    viewerProfileId = profile?.id ?? null;
    needsOnboarding = profile !== null && !profile.onboarded_at;
    followedIds = profile ? await listFollowedIds(db, profile.id) : [];

    // Sin sesión, la landing necesita su muestra de fichas ya resuelta.
    if (!signedIn) page = await listFeedPage(db);
  } catch {
    page = null;
    sessionOk = false;
  }
  const followingView = filter === "following" && signedIn;

  // Usuario nuevo: al onboarding hasta que lo complete o lo salte (marca de la
  // migración 008). Fuera del try: redirect() lanza una excepción interna de
  // Next que el catch no debe tragarse.
  if (needsOnboarding) redirect("/onboarding");

  return (
    <main className={signedIn ? "mx-auto max-w-2xl px-4 py-8 sm:px-6" : ""}>
      {signedIn ? (
        // Con sesión la marca está en la navegación; el h1 se mantiene para
        // lectores de pantalla y buscadores, que no deben quedarse sin él.
        <h1 className="sr-only">snapstack — {TAGLINE}</h1>
      ) : (
        <>
          {/* Hero: las tarjetas reales del feed derivando al fondo, el texto
              entrando escalonado por encima. */}
          <section
            data-testid="landing-hero"
            className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-4 text-center"
          >
            <HeroCardsBackground repos={page?.repos ?? []} />
            <div className="relative flex flex-col items-center">
              <h1
                data-testid="hero-wordmark"
                className="landing-rise font-mono text-6xl font-bold lowercase tracking-tight sm:text-8xl"
              >
                snapstack
              </h1>
              <p
                className="landing-rise mt-6 max-w-2xl text-2xl font-medium sm:text-3xl"
                style={{ animationDelay: "0.15s" }}
              >
                Your best work, worth showing off.
              </p>
              <p
                className="landing-rise mt-3 max-w-xl text-lg text-content-secondary"
                style={{ animationDelay: "0.3s" }}
              >
                Pick the repos you&apos;re proud of and let them speak for you — and see what
                other devs are building.
              </p>
              <div className="landing-rise mt-10" style={{ animationDelay: "0.45s" }}>
                <AuthControls size="lg" />
              </div>
            </div>
          </section>

          <LanguageMarquee />
          <HowItWorks />
          <Faq />

          {/* Muestra del feed: 3 fichas y una cuarta desvaneciéndose — "hay más".
              El feed completo es para quien entra; la landing solo enseña que
              está vivo. El CTA va justo debajo, donde el interés está caliente. */}
          {page && page.repos.length > 0 ? (
            <section data-testid="landing-feed-preview" className="mx-auto max-w-2xl px-4 pt-4 sm:px-6">
              <h2 className="mb-6 text-center font-mono text-3xl font-bold">The feed, live</h2>
              <div className="flex flex-col gap-6">
                {page.repos.slice(0, 3).map((repo) => (
                  <RepoCard key={repo.id} repo={repo} />
                ))}
              </div>
              {page.repos.length > 3 ? (
                <div aria-hidden className="relative mt-6 max-h-44 overflow-hidden">
                  <RepoCard repo={page.repos[3]} />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/70 to-background" />
                </div>
              ) : null}
            </section>
          ) : null}

          <LandingCta />
        </>
      )}

      <div className={signedIn ? "" : "hidden"}>
      {signedIn ? (
        <nav data-testid="feed-tabs" className="mb-6 flex gap-2 font-mono text-sm">
          <Link
            href="/"
            data-testid="feed-tab-all"
            className={`rounded-lg px-3 py-1.5 ${!followingView ? "bg-surface text-content" : "text-content-secondary hover:text-content"}`}
          >
            All
          </Link>
          <Link
            href="/?filter=following"
            data-testid="feed-tab-following"
            className={`rounded-lg px-3 py-1.5 ${followingView ? "bg-surface text-content" : "text-content-secondary hover:text-content"}`}
          >
            Following
          </Link>
        </nav>
      ) : null}

      {signedIn && sessionOk ? (
        <Suspense key={followingView ? "following" : "all"} fallback={<FeedBodySkeleton />}>
          <FeedBody
            followingView={followingView}
            followedIds={followedIds}
            viewerProfileId={viewerProfileId}
          />
        </Suspense>
      ) : !sessionOk ? (
        <p data-testid="feed-unavailable" className="text-error">
          The feed is unavailable right now. Check back soon.
        </p>
      ) : null}
      </div>
    </main>
  );
}
