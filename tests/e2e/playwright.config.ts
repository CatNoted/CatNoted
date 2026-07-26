import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./",
  timeout: 60000,
  retries: 0,
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000"
  },
  webServer: {
    command: 'npx vite preview --port 3000',
    cwd: '../../apps/web',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  }
});
