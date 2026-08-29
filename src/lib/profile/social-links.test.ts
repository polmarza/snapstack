import { describe, it, expect } from "vitest";
import {
  normalizeSocialLinks,
  parseStoredSocialLinks,
  SOCIAL_URL_MAX_LENGTH,
} from "./social-links";

describe("normalizeSocialLinks", () => {
  it("C-03: acepta URLs válidas de cada plataforma y normaliza el href", () => {
    const { links, errors } = normalizeSocialLinks({
      x: "https://x.com/polmarza",
      linkedin: "https://www.linkedin.com/in/polmarza/",
      youtube: "https://youtube.com/@canal",
      substack: "https://polmarza.substack.com",
      website: "https://polmarza.dev",
    });
    expect(errors).toEqual({});
    expect(links).toEqual({
      x: "https://x.com/polmarza",
      linkedin: "https://www.linkedin.com/in/polmarza/",
      youtube: "https://youtube.com/@canal",
      substack: "https://polmarza.substack.com/",
      website: "https://polmarza.dev/",
    });
  });

  it("C-03: antepone https a un enlace sin esquema", () => {
    const { links, errors } = normalizeSocialLinks({ x: "x.com/polmarza" });
    expect(errors).toEqual({});
    expect(links.x).toBe("https://x.com/polmarza");
  });

  it("C-03: campos vacíos u omitidos eliminan el enlace, sin error", () => {
    const { links, errors } = normalizeSocialLinks({ x: "  ", linkedin: "" });
    expect(links).toEqual({});
    expect(errors).toEqual({});
  });

  it("seguridad: rechaza esquemas que no son https — los valores acaban en href", () => {
    for (const raw of [
      "http://x.com/polmarza",
      "javascript:alert(1)",
      "data:text/html,hola",
      "ftp://x.com/a",
    ]) {
      const { links, errors } = normalizeSocialLinks({ x: raw });
      expect(links.x, raw).toBeUndefined();
      expect(errors.x, raw).toBeTruthy();
    }
  });

  it("seguridad: el host debe ser de la plataforma (subdominios sí, parecidos no)", () => {
    expect(normalizeSocialLinks({ x: "https://x.com.evil.dev/a" }).errors.x).toBeTruthy();
    expect(normalizeSocialLinks({ x: "https://notx.com/a" }).errors.x).toBeTruthy();
    expect(normalizeSocialLinks({ reddit: "https://old.reddit.com/user/a" }).errors.reddit).toBeUndefined();
    expect(normalizeSocialLinks({ substack: "https://blog.substack.com/x" }).errors.substack).toBeUndefined();
    // Mastodon es federado y la web personal es libre: cualquier host https vale.
    expect(normalizeSocialLinks({ mastodon: "https://hachyderm.io/@dev" }).errors.mastodon).toBeUndefined();
    expect(normalizeSocialLinks({ website: "https://loquesea.example" }).errors.website).toBeUndefined();
  });

  it("rechaza URLs desmesuradas y descarta claves fuera de la lista blanca", () => {
    const larga = `https://x.com/${"a".repeat(SOCIAL_URL_MAX_LENGTH)}`;
    expect(normalizeSocialLinks({ x: larga }).errors.x).toBeTruthy();
    const { links } = normalizeSocialLinks({ myspace: "https://myspace.com/a" });
    expect(links).toEqual({});
  });
});

describe("parseStoredSocialLinks", () => {
  it("solo devuelve plataformas conocidas con https", () => {
    expect(
      parseStoredSocialLinks({
        x: "https://x.com/a",
        myspace: "https://myspace.com/a",
        linkedin: "javascript:alert(1)",
        youtube: 42,
      }),
    ).toEqual({ x: "https://x.com/a" });
    expect(parseStoredSocialLinks(null)).toEqual({});
    expect(parseStoredSocialLinks("cadena")).toEqual({});
  });
});
