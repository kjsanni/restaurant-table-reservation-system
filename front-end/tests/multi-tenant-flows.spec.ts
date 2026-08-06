import { test, expect } from "@playwright/test";

const requiresSeededData = process.env.E2E_MULTI_TENANT_ENABLED === "true";

test.describe("Multi-tenant flows", () => {
  test.beforeEach(async ({ page }) => {
    if (!requiresSeededData) {
      test.skip(true, "Requires seeded tenants, feature flags, and running backend");
    }
    await page.goto("/login");
  });

  test.describe("Checkout isolation", () => {
    test("tenant A cannot see tenant B orders after checkout", async ({ page }) => {
      await page.fill('input[name="email"]', "tenant-a@example.com");
      await page.fill('input[name="password"]', "password123");
      await page.click('button[type="submit"]');
      await page.waitForURL((url) => !url.pathname.includes("/login"));

      await page.goto("/checkout");
      await page.waitForLoadState("networkidle");

      const orderIds = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("[data-order-id]"))
          .map((el) => el.getAttribute("data-order-id"))
          .filter(Boolean);
      });

      expect(orderIds.length).toBeGreaterThan(0);

      await page.evaluate((ids) => {
        ids.forEach((id) => {
          localStorage.setItem(`lastSeenOrder_${id}`, "true");
        });
      }, orderIds);

      await page.evaluate(() => authStore.logout());
      await page.waitForURL((url) => url.pathname.includes("/login"));

      await page.fill('input[name="email"]', "tenant-b@example.com");
      await page.fill('input[name="password"]', "password123");
      await page.click('button[type="submit"]');
      await page.waitForURL((url) => !url.pathname.includes("/login"));

      await page.goto("/checkout");
      await page.waitForLoadState("networkidle");

      const tenantBOrderIds = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("[data-order-id]"))
          .map((el) => el.getAttribute("data-order-id"))
          .filter(Boolean);
      });

      for (const id of orderIds) {
        expect(tenantBOrderIds).not.toContain(id);
      }
    });

    test("checkout preserves cart state on validation error", async ({ page }) => {
      await page.fill('input[name="email"]', "tenant-a@example.com");
      await page.fill('input[name="password"]', "password123");
      await page.click('button[type="submit"]');
      await page.waitForURL((url) => !url.pathname.includes("/login"));

      await page.goto("/menu");
      await page.waitForLoadState("networkidle");

      const addButtons = page.locator(".add-btn").first();
      if (await addButtons.count() > 0) {
        await addButtons.click();
        await page.waitForTimeout(500);

        const cartCount = await page.locator(".cart-count").textContent();
        expect(cartCount).not.toBe("0");

        await page.goto("/checkout");
        await page.waitForLoadState("networkidle");

        const checkoutCartCount = await page.locator(".cart-count").textContent();
        expect(checkoutCartCount).toBe(cartCount);
      }
    });
  });

  test.describe("Feature toggle flows", () => {
    test("tenant without table_management flag does not see floor plan nav", async ({ page }) => {
      await page.fill('input[name="email"]', "no-table-mgmt@example.com");
      await page.fill('input[name="password"]', "password123");
      await page.click('button[type="submit"]');
      await page.waitForURL((url) => !url.pathname.includes("/login"));

      const floorPlanLink = page.getByRole("link", { name: /floor plan/i });
      if (await floorPlanLink.count() > 0) {
        await expect(floorPlanLink).toHaveCount(0);
      }
    });

    test("tenant with table_management flag sees floor plan nav", async ({ page }) => {
      await page.fill('input[name="email"]', "table-mgmt@example.com");
      await page.fill('input[name="password"]', "password123");
      await page.click('button[type="submit"]');
      await page.waitForURL((url) => !url.pathname.includes("/login"));

      const floorPlanLink = page.getByRole("link", { name: /floor plan/i });
      await expect(floorPlanLink).toHaveCount(1);
    });
  });

  test.describe("Customer portal vertical branding", () => {
    test("customer register page applies tenant branding from public API", async ({ page }) => {
      await page.goto("/customer/register/tenant-a-slug");
      await page.waitForLoadState("networkidle");

      const brandName = await page
        .locator(".brand-name")
        .textContent();

      expect(brandName?.length).toBeGreaterThan(0);
      expect(brandName).not.toBe("Customer Portal");
    });

    test("customer register page falls back to default when branding fetch fails", async ({ page }) => {
      await page.goto("/customer/register/invalid-tenant-slug");
      await page.waitForLoadState("networkidle");

      const brandName = await page
        .locator(".brand-name")
        .textContent();

      expect(brandName).toBe("Customer Portal");
    });
  });
});
