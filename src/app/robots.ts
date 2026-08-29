import type { MetadataRoute } from "next";

/**
 * El feed y los perfiles son indexables a propósito (requisito no funcional del
 * PRD). Fuera del índice: lo que exige sesión, las herramientas de desarrollo y
 * la API.
 */
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/__clerk/", "/dev/", "/settings/", "/onboarding"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
