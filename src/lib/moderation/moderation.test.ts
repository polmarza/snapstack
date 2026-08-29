import { describe, it, expect } from "vitest";
import { findBlockedTerm, repoBlockedTerm } from "./moderation";

describe("findBlockedTerm", () => {
  it("S-01: detecta un término bloqueado en cualquier campo", () => {
    expect(findBlockedTerm("free porn collection")).not.toBeNull();
    expect(findBlockedTerm("repo limpio", "descripción con hentai dentro")).not.toBeNull();
  });

  it("S-01: el contenido normal pasa", () => {
    expect(findBlockedTerm("snapstack", "A social feed of curated GitHub repos")).toBeNull();
    expect(findBlockedTerm("awesome-python", "curated list", "machine-learning")).toBeNull();
  });

  it("S-01: respeta límites de palabra — 'class' no cae por contener 'ass'", () => {
    expect(findBlockedTerm("my-class-helpers")).toBeNull();
    expect(findBlockedTerm("scunthorpe-utils")).toBeNull();
    expect(findBlockedTerm("pornography-detector")).toBeNull(); // "pornography" ≠ "porn" con límite de palabra
  });

  it("S-01: los separadores de nombres de repo no esquivan el filtro", () => {
    expect(findBlockedTerm("mega_porn_scraper")).not.toBeNull();
    expect(findBlockedTerm("algo/porno/x")).not.toBeNull();
  });

  it("S-01: ignora mayúsculas y acentos", () => {
    expect(findBlockedTerm("PORNO total")).not.toBeNull();
    expect(findBlockedTerm("maricón")).not.toBeNull();
  });
});

describe("repoBlockedTerm", () => {
  it("S-01: revisa nombre, descripción y topics del repo", () => {
    const base = { full_name: "dev/limpio", description: "todo bien", topics: ["nextjs"] };
    expect(repoBlockedTerm(base)).toBeNull();
    expect(repoBlockedTerm({ ...base, topics: ["hentai"] })).not.toBeNull();
    expect(repoBlockedTerm({ ...base, description: null })).toBeNull();
  });
});
