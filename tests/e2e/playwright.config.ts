import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: ".",
  timeout: 60000,
  retries: 0,
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000"
  },
  webServer: {
    command: "pnpm --filter @catnoted/web dev --port 3000",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    stdout: "ignore",
    stderr: "pipe",
  }
});
