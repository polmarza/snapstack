import { defineConfig } from "@playwright/test";

/**
 * E2E siempre contra localhost (ver "Límites de ejecución" en CLAUDE.md).
 * Requiere una vez: pnpm exec playwright install chromium
 */
export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: "http://localhost:3000" },
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
  },
});
