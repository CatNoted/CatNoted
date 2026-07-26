import { test, expect } from "@playwright/test";
const BASE = process.env.BASE_URL || "http://localhost:3000";
test.describe("CatNoted route health", () => {
  const routes = ["/", "/tools/quick-capture", "/tools/link-saver", "/tools/flashcards", "/tools/kanban", "/tools/emotion-jar", "/games"];
  for (const route of routes) {
    test(`GET ${route} -> 200 or redirect`, async ({ page }) => {
      const resp = await page.goto(BASE + route);
      expect([200, 301, 302, 307, 308]).toContain(resp.status());
    });
  }
});
