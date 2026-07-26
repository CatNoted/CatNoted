import { defineConfig } from "@playwright/test";
export default defineConfig({ testDir: "./tests/e2e", timeout: 60000, retries: 0, use: { baseURL: process.env.BASE_URL || "http://localhost:3000" } });
