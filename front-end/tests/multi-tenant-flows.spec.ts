import { test, expect } from "@playwright/test";
import { E2E_TENANT_SLUG } from "./fixtures";

test.describe("Multi-tenant flows", () => {
  test.beforeEach(async ({ page }) => {
    if (process.env.E2E_BACKEND_URL === "false") {
      test.skip(true, "Backend E2E disabled");
    }
  });

  test.describe("Checkout isolation", () => {
    test("tenant A cannot see tenant B orders after checkout", async ({ page }) => {
      await page.goto(`/t/${E2E_TENANT_SLUG}/login`);
      await page.fill("#email", "tenant-a@example.com");
      await page.fill("#password", "password123");
      await page.click('button[type="submit"]');
      await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 120000, waitUntil: "commit" });

      await page.goto("/checkout");
      await page.waitForLoadState("domcontentloaded");

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

      await page.evaluate(() => (window as any).authStore?.logout?.());
      await page.waitForURL((url) => url.pathname.includes("/login"));

      await page.fill("#email", "tenant-b@example.com");
      await page.fill("#password", "password123");
      await page.click('button[type="submit"]');
      await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 120000, waitUntil: "commit" });

      await page.goto("/checkout");
      await page.waitForLoadState("domcontentloaded");

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
      await page.goto(`/t/${E2E_TENANT_SLUG}/login`);
      await page.fill("#email", "tenant-a@example.com");
      await page.fill("#password", "password123");
      await page.click('button[type="submit"]');
      await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 120000, waitUntil: "commit" });

      await page.goto("/menu");
      await page.waitForLoadState("domcontentloaded");

      const addButtons = page.locator(".add-btn").first();
      if (await addButtons.count() > 0) {
        await addButtons.click();
        await page.waitForTimeout(500);

        const cartCount = await page.locator(".cart-count").textContent();
        expect(cartCount).not.toBe("0");

        await page.goto("/checkout");
        await page.waitForLoadState("domcontentloaded");

        const checkoutCartCount = await page.locator(".cart-count").textContent();
        expect(checkoutCartCount).toBe(cartCount);
      }
    });
  });

  test.describe("Feature toggle flows", () => {
    test("tenant without table_management flag does not see floor plan nav", async ({ page }) => {
      await page.goto(`/t/${E2E_TENANT_SLUG}/login`);
      await page.fill("#email", "no-table-mgmt@example.com");
      await page.fill("#password", "password123");
      await page.click('button[type="submit"]');
      await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 120000, waitUntil: "commit" });

      const floorPlanLink = page.getByRole("link", { name: /floor plan/i });
      if (await floorPlanLink.count() > 0) {
        await expect(floorPlanLink).toHaveCount(0);
      }
    });

    test("tenant with table_management flag sees floor plan nav", async ({ page }) => {
      await page.goto(`/t/${E2E_TENANT_SLUG}/login`);
      await page.fill("#email", "table-mgmt@example.com");
      await page.fill("#password", "password123");
      await page.click('button[type="submit"]');
      await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 120000, waitUntil: "commit" });

      const floorPlanLink = page.getByRole("link", { name: /floor plan/i });
      await expect(floorPlanLink).toHaveCount(1);
    });
  });

  test.describe("Customer portal vertical branding", () => {
    test("customer register page applies tenant branding from public API", async ({ page }) => {
      await page.goto("/customer/register/tenant-a-slug");
      await page.waitForLoadState("domcontentloaded");

      const brandName = await page
        .locator(".brand-name")
        .textContent();

      expect(brandName?.length).toBeGreaterThan(0);
      expect(brandName).not.toBe("Customer Portal");
    });

    test("customer register page falls back to default when branding fetch fails", async ({ page }) => {
      await page.goto("/customer/register/invalid-tenant-slug");
      await page.waitForLoadState("domcontentloaded");

      const brandName = await page
        .locator(".brand-name")
        .textContent();

      expect(brandName).toBe("Customer Portal");
    });
  });
});
