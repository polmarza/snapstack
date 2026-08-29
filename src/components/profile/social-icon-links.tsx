import { Globe } from "lucide-react";
import {
  siBluesky,
  siMastodon,
  siReddit,
  siSubstack,
  siTwitch,
  siX,
  siYoutube,
} from "simple-icons";
import {
  SOCIAL_PLATFORM_KEYS,
  SOCIAL_PLATFORMS,
  type SocialLinks,
  type SocialPlatformKey,
} from "@/lib/profile/social-links";

/** Marca en path SVG: simple-icons usa viewBox 24; el de LinkedIn (bootstrap-icons,
    MIT — simple-icons no lo distribuye por política de marca) usa 16. */
const BRAND_PATHS: Partial<Record<SocialPlatformKey, { d: string; viewBox: string }>> = {
  x: { d: siX.path, viewBox: "0 0 24 24" },
  youtube: { d: siYoutube.path, viewBox: "0 0 24 24" },
  reddit: { d: siReddit.path, viewBox: "0 0 24 24" },
  substack: { d: siSubstack.path, viewBox: "0 0 24 24" },
  twitch: { d: siTwitch.path, viewBox: "0 0 24 24" },
  bluesky: { d: siBluesky.path, viewBox: "0 0 24 24" },
  mastodon: { d: siMastodon.path, viewBox: "0 0 24 24" },
  linkedin: {
    d: "M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z",
    viewBox: "0 0 16 16",
  },
};

/**
 * Fila compacta de iconos con los enlaces sociales del perfil (C-03). Solo
 * renderiza plataformas con enlace; sin enlaces, nada.
 */
export function SocialIconLinks({ links }: { links: SocialLinks }) {
  const activos = SOCIAL_PLATFORM_KEYS.filter((key) => links[key]);
  if (activos.length === 0) return null;

  return (
    <span data-testid="profile-social-links" className="flex items-center gap-2.5">
      {activos.map((key) => {
        const brand = BRAND_PATHS[key];
        return (
          <a
            key={key}
            href={links[key]}
            target="_blank"
            rel="noopener noreferrer nofollow"
            aria-label={SOCIAL_PLATFORMS[key].label}
            title={SOCIAL_PLATFORMS[key].label}
            data-testid={`profile-social-${key}`}
            className="text-content-secondary transition-colors hover:text-content"
          >
            {brand ? (
              <svg
                aria-hidden
                viewBox={brand.viewBox}
                width={15}
                height={15}
                fill="currentColor"
              >
                <path d={brand.d} />
              </svg>
            ) : (
              <Globe aria-hidden size={15} strokeWidth={1.8} />
            )}
          </a>
        );
      })}
    </span>
  );
}
