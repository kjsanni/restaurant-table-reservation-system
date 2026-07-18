import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const routes = [
  { name: "Login", path: "/login" },
  { name: "Register", path: "/register" },
  { name: "Reservations", path: "/reservations" },
  { name: "New Reservation", path: "/new-reservation" },
  { name: "Floor Plan", path: "/floor-plan" },
  { name: "Tables", path: "/tables" },
  { name: "Schedule", path: "/schedule" },
  { name: "Settings", path: "/settings" },
];

for (const route of routes) {
  test.describe(`Accessibility - ${route.name}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(route.path);
    });

    test("should not have any automatically detectable accessibility issues", async ({ page }) => {
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });
  });
}
