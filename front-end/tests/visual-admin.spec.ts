import { test, expect } from "@playwright/test";

const viewports = [
  { name: "Desktop", width: 1280, height: 720 },
  { name: "Tablet", width: 768, height: 1024 },
  { name: "Mobile", width: 375, height: 667 },
];

const adminRoutes = [
  { name: "Admin Login", path: "/super-admin/login" },
  { name: "Admin Dashboard", path: "/admin" },
  { name: "Tenant Settings", path: "/admin/settings" },
];

for (const route of adminRoutes) {
  for (const viewport of viewports) {
    test.describe(`Visual Admin - ${route.name} (${viewport.name})`, () => {
      test("should match baseline screenshot", async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(route.path);
        await page.waitForLoadState("load");
        await expect(page).toHaveScreenshot(`${route.name.toLowerCase().replace(/\s+/g, "-")}-${viewport.name.toLowerCase()}.png`, {
          fullPage: true,
        });
      });
    });
  }
}
