import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { loginAsTenantStaff } from "./fixtures";

const publicRoutes = [
  { name: "Login", path: "/login" },
  { name: "Register", path: "/register" },
];

const protectedRoutes = [
  { name: "Reservations", path: "/reservations" },
  { name: "New Reservation", path: "/new-reservation" },
  { name: "Floor Plan", path: "/floor-plan" },
  { name: "Tables", path: "/tables" },
  { name: "Schedule", path: "/schedule" },
  { name: "Settings", path: "/settings" },
  { name: "Salon Dashboard", path: "/salon/dashboard" },
  { name: "Salon Appointments", path: "/appointments" },
  { name: "Salon Stations", path: "/stations" },
  { name: "Salon Services", path: "/services" },
  { name: "Salon Station Map", path: "/station-map" },
  { name: "Salon Calendar", path: "/salon/calendar" },
  { name: "Salon Schedule", path: "/salon/schedule" },
  { name: "Salon Holidays", path: "/salon/holidays" },
  { name: "Salon Walk-ins", path: "/salon/walkins" },
  { name: "Salon Staff Shifts", path: "/salon/shifts" },
  { name: "Salon Reports", path: "/salon/reports" },
  { name: "Salon Recurring", path: "/salon/recurring" },
  { name: "Salon Clients", path: "/salon/clients" },
  { name: "Salon Settings", path: "/salon/settings" },
  { name: "Salon Marketing", path: "/salon/marketing" },
  { name: "Salon Gallery", path: "/salon/gallery" },
];

for (const route of publicRoutes) {
  test.describe(`Accessibility - ${route.name}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(route.path);
      await page.waitForLoadState("domcontentloaded");
    });

    test("should not have any automatically detectable accessibility issues", async ({ page }) => {
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });
  });
}

for (const route of protectedRoutes) {
  test.describe(`Accessibility - ${route.name}`, () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantStaff(page);
      await page.goto(route.path);
      await page.waitForLoadState("domcontentloaded");
    });

    test("should not have any automatically detectable accessibility issues", async ({ page }) => {
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });
  });
}
