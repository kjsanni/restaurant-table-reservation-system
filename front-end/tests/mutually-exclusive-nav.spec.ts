import { test, expect } from "@playwright/test";

const salonNavItems = [
  "Appointments",
  "Calendar",
  "Hours",
  "Walk-ins",
  "Staff Shifts",
  "Stations",
  "Station Map",
  "Services",
];

const restaurantNavItems = [
  "Reservations",
  "Tables",
  "Schedule",
  "Waitlist",
  "Floor Plan",
];

test.describe("Mutually exclusive navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("salon tenant should see salon nav and not restaurant nav", async ({ page }) => {
    const hasSalonTenant = process.env.E2E_SALON_TENANT_ENABLED === "true";

    if (!hasSalonTenant) {
      test.skip(true, "Requires seeded salon tenant and running backend");
      return;
    }

    await page.fill('input[name="email"]', "salon-tenant@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    await page.waitForURL((url) => !url.pathname.includes("/login"));

    for (const item of restaurantNavItems) {
      await expect(page.getByRole("link", { name: item })).toHaveCount(0);
    }

    const visibleSalonItems = await page.evaluate((items) => {
      return items.filter((label) => {
        const nav = document.querySelector('[role="navigation"], nav, .va-sidebar, aside');
        if (!nav) return false;
        return nav.textContent?.includes(label);
      });
    }, salonNavItems);

    expect(visibleSalonItems.length).toBeGreaterThan(0);
  });

  test("restaurant tenant should see restaurant nav and not salon nav", async ({ page }) => {
    const hasRestaurantTenant = process.env.E2E_RESTAURANT_TENANT_ENABLED === "true";

    if (!hasRestaurantTenant) {
      test.skip(true, "Requires seeded restaurant tenant and running backend");
      return;
    }

    await page.fill('input[name="email"]', "restaurant-tenant@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    await page.waitForURL((url) => !url.pathname.includes("/login"));

    for (const item of salonNavItems) {
      await expect(page.getByRole("link", { name: item })).toHaveCount(0);
    }

    const visibleRestaurantItems = await page.evaluate((items) => {
      return items.filter((label) => {
        const nav = document.querySelector('[role="navigation"], nav, .va-sidebar, aside');
        if (!nav) return false;
        return nav.textContent?.includes(label);
      });
    }, restaurantNavItems);

    expect(visibleRestaurantItems.length).toBeGreaterThan(0);
  });
});
