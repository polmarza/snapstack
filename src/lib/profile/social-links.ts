/**
 * Enlaces sociales del perfil (C-03): lista blanca de plataformas con
 * validación de host en servidor. Los valores acaban en `href` de la página
 * pública, así que aquí no pasa nada que no sea una URL https de la plataforma
 * declarada (o cualquier https para Mastodon, que es federado, y la web
 * personal).
 */

export interface SocialPlatform {
  /** Nombre visible ("X", "LinkedIn"…). */
  label: string;
  /** Hosts aceptados (subdominios incluidos); null = cualquier host https. */
  hosts: string[] | null;
  /** Ejemplo mostrado en el formulario. */
  placeholder: string;
}

export const SOCIAL_PLATFORMS = {
  x: { label: "X", hosts: ["x.com", "twitter.com"], placeholder: "https://x.com/usuario" },
  linkedin: {
    label: "LinkedIn",
    hosts: ["linkedin.com"],
    placeholder: "https://www.linkedin.com/in/usuario",
  },
  youtube: {
    label: "YouTube",
    hosts: ["youtube.com", "youtu.be"],
    placeholder: "https://youtube.com/@canal",
  },
  reddit: { label: "Reddit", hosts: ["reddit.com"], placeholder: "https://reddit.com/user/usuario" },
  substack: {
    label: "Substack",
    hosts: ["substack.com"],
    placeholder: "https://usuario.substack.com",
  },
  twitch: { label: "Twitch", hosts: ["twitch.tv"], placeholder: "https://twitch.tv/canal" },
  bluesky: { label: "Bluesky", hosts: ["bsky.app"], placeholder: "https://bsky.app/profile/usuario" },
  mastodon: { label: "Mastodon", hosts: null, placeholder: "https://instancia.social/@usuario" },
  website: { label: "Website", hosts: null, placeholder: "https://tusitio.dev" },
} as const satisfies Record<string, SocialPlatform>;

export type SocialPlatformKey = keyof typeof SOCIAL_PLATFORMS;

export const SOCIAL_PLATFORM_KEYS = Object.keys(SOCIAL_PLATFORMS) as SocialPlatformKey[];

/** Enlaces persistidos en `profiles.social_links`. */
export type SocialLinks = Partial<Record<SocialPlatformKey, string>>;

export const SOCIAL_URL_MAX_LENGTH = 200;
export const TAGLINE_MAX_LENGTH = 80;
export const BIO_MAX_LENGTH = 280;

const hostAllowed = (host: string, allowed: string[] | null): boolean => {
  if (allowed === null) return true;
  return allowed.some((h) => host === h || host === `www.${h}` || host.endsWith(`.${h}`));
};

export interface SocialLinksResult {
  links: SocialLinks;
  /** Un error legible por plataforma inválida; vacío si todo pasó. */
  errors: Partial<Record<SocialPlatformKey, string>>;
}

/**
 * Normaliza y valida el formulario completo. Campos vacíos se omiten (borrar
 * el texto elimina el enlace); claves fuera de la lista blanca se descartan en
 * silencio (no vienen del formulario legítimo).
 */
export function normalizeSocialLinks(input: Record<string, string>): SocialLinksResult {
  const links: SocialLinks = {};
  const errors: SocialLinksResult["errors"] = {};

  for (const key of SOCIAL_PLATFORM_KEYS) {
    const raw = (input[key] ?? "").trim();
    if (!raw) continue;

    const platform = SOCIAL_PLATFORMS[key];
    if (raw.length > SOCIAL_URL_MAX_LENGTH) {
      errors[key] = `Too long (max ${SOCIAL_URL_MAX_LENGTH} characters).`;
      continue;
    }

    // Sin esquema se asume https; cualquier otro esquema se rechaza.
    const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw) ? raw : `https://${raw}`;
    let url: URL;
    try {
      url = new URL(withScheme);
    } catch {
      errors[key] = "That doesn't look like a valid URL.";
      continue;
    }
    if (url.protocol !== "https:") {
      errors[key] = "Only https:// links are allowed.";
      continue;
    }
    if (!hostAllowed(url.hostname.toLowerCase(), platform.hosts)) {
      errors[key] = `That's not a ${platform.label} URL.`;
      continue;
    }
    links[key] = url.href;
  }

  return { links, errors };
}

/** Lee de forma segura los enlaces persistidos: solo plataformas conocidas con https. */
export function parseStoredSocialLinks(value: unknown): SocialLinks {
  if (value === null || typeof value !== "object") return {};
  const links: SocialLinks = {};
  for (const key of SOCIAL_PLATFORM_KEYS) {
    const url = (value as Record<string, unknown>)[key];
    if (typeof url === "string" && url.startsWith("https://")) links[key] = url;
  }
  return links;
}
