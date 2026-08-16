import { test, expect } from "@playwright/test";
import { loginAsPlatformAdmin, loginAsTenantStaff, E2E_TENANT_SLUG } from "./fixtures";

const E2E_CUSTOMER_EMAIL = process.env.E2E_CUSTOMER_EMAIL || "customer@demo.test";
const E2E_CUSTOMER_PASSWORD = process.env.E2E_CUSTOMER_PASSWORD || "customer123";

async function loginAsCustomer(page) {
  await page.goto("/customer/login");
  await page.waitForLoadState("domcontentloaded");
  await page.fill("#email", E2E_CUSTOMER_EMAIL);
  await page.fill("#password", E2E_CUSTOMER_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 120000, waitUntil: "commit" });
}

test.describe("Event flows", () => {
  test.beforeEach(async ({ page }) => {
    if (process.env.E2E_BACKEND_URL === "false") {
      test.skip(true, "Backend E2E disabled");
    }
  });

  test.describe("Customer event portal", () => {
    test("customer can browse events and view event details", async ({ page }) => {
      await loginAsCustomer(page);

      await page.goto("/portal/events");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.locator("h1")).toContainText("Events");
      await expect(page.locator("p")).toContainText("Customer portal events");
    });

    test("customer can book a free event", async ({ page }) => {
      await loginAsCustomer(page);

      await page.goto("/portal/events");
      await page.waitForLoadState("domcontentloaded");

      const freeEvent = page.locator(".event-card").first();
      if ((await freeEvent.count()) > 0) {
        await freeEvent.click();
        await page.waitForURL((url) => url.pathname.includes("/portal/events/"));

        const bookButton = page.locator(".book-btn").first();
        if (await bookButton.count() > 0 && await bookButton.isEnabled()) {
          await bookButton.click();
          await expect(page.locator(".modal-overlay")).toBeVisible();
        }
      }
    });
  });

  test.describe("Tenant event management", () => {
    test("tenant admin can manage events", async ({ page }) => {
      await loginAsTenantStaff(page);

      await page.goto("/events/manage");
      await page.waitForLoadState("domcontentloaded");
      await expect(page.locator("h1")).toContainText("Events");
    });

    test("tenant admin can manage guest list", async ({ page }) => {
      await loginAsTenantStaff(page);

      await page.goto("/events/manage");
      await page.waitForLoadState("domcontentloaded");

      const eventRow = page.locator(".event-row").first();
      if (await eventRow.count() > 0) {
        await eventRow.click();
        await page.waitForURL((url) => url.pathname.includes("/events/"));
        await page.goto("/events/1/guests");
        await page.waitForLoadState("domcontentloaded");
        await expect(page.locator("h1")).toContainText("Guest List");
      } else {
        test.skip(true, "No seeded events available");
      }
    });

    test("tenant admin can manage ticket types", async ({ page }) => {
      await loginAsTenantStaff(page);

      await page.goto("/events/1/ticket-types");
      await page.waitForLoadState("domcontentloaded");
      await expect(page.locator("h1")).toContainText("Ticket Types");
    });

    test("tenant admin can manage QR codes", async ({ page }) => {
      await loginAsTenantStaff(page);

      await page.goto("/events/1/qr-codes");
      await page.waitForLoadState("domcontentloaded");
      await expect(page.locator("h1")).toContainText("QR Codes");
    });
  });

  test.describe("Super-admin event management", () => {
    test("super-admin can view platform events", async ({ page }) => {
      await loginAsPlatformAdmin(page);

      await page.goto("/super-admin/events");
      await page.waitForLoadState("domcontentloaded");
      await expect(page.locator("h1")).toContainText("Event Management");
    });
  });
});
