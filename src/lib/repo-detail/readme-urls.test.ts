import { describe, it, expect } from "vitest";
import { resolveReadmeUrl } from "./readme-urls";

const REPO = "polmarza/snapstack";

describe("resolveReadmeUrl", () => {
  it("C-05: las absolutas http(s) y mailto pasan tal cual", () => {
    expect(resolveReadmeUrl("https://example.com/a", REPO, "link")).toBe("https://example.com/a");
    expect(resolveReadmeUrl("http://example.com", REPO, "image")).toBe("http://example.com");
    expect(resolveReadmeUrl("mailto:hola@example.com", REPO, "link")).toBe("mailto:hola@example.com");
  });

  it("C-05: las relativas van al repo — blob para enlaces, raw para imágenes", () => {
    expect(resolveReadmeUrl("docs/guia.md", REPO, "link")).toBe(
      "https://github.com/polmarza/snapstack/blob/HEAD/docs/guia.md",
    );
    expect(resolveReadmeUrl("./assets/logo.png", REPO, "image")).toBe(
      "https://raw.githubusercontent.com/polmarza/snapstack/HEAD/assets/logo.png",
    );
    expect(resolveReadmeUrl("/absoluta-del-repo.md", REPO, "link")).toBe(
      "https://github.com/polmarza/snapstack/blob/HEAD/absoluta-del-repo.md",
    );
  });

  it("C-05: las anclas internas se conservan", () => {
    expect(resolveReadmeUrl("#instalacion", REPO, "link")).toBe("#instalacion");
  });

  it("seguridad: cualquier otro esquema se anula — el README es contenido de terceros", () => {
    for (const url of [
      "javascript:alert(1)",
      "data:text/html,<script>1</script>",
      "vbscript:x",
      "file:///etc/passwd",
      "//evil.example/x",
    ]) {
      expect(resolveReadmeUrl(url, REPO, "link"), url).toBe("");
      expect(resolveReadmeUrl(url, REPO, "image"), url).toBe("");
    }
    expect(resolveReadmeUrl("   ", REPO, "link")).toBe("");
  });
});
