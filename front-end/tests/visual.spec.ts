import { test, expect } from "@playwright/test";

const viewports = [
  { name: "Desktop", width: 1280, height: 720 },
  { name: "Tablet", width: 768, height: 1024 },
  { name: "Mobile", width: 375, height: 667 },
];

const routes = [
  { name: "Login", path: "/login" },
  { name: "Reservations", path: "/reservations" },
  { name: "New Reservation", path: "/new-reservation" },
  { name: "Floor Plan", path: "/floor-plan" },
  { name: "Settings", path: "/settings" },
];

for (const route of routes) {
  for (const viewport of viewports) {
    test.describe(`Visual - ${route.name} (${viewport.name})`, () => {
      test("should match baseline screenshot", async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(route.path);
        await page.waitForLoadState("networkidle");
        await expect(page).toHaveScreenshot(`${route.name.toLowerCase().replace(/\s+/g, "-")}-${viewport.name.toLowerCase()}.png`, {
          fullPage: true,
        });
      });
    });
  }
}
