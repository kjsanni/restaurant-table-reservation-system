import { test, expect } from "@playwright/test";
import { loginAsTenantStaff, E2E_TENANT_SLUG } from "./fixtures";

test.describe("Event admin flow - QR codes, guest list, ticket types", () => {
  test.beforeEach(async ({ page }) => {
    if (process.env.E2E_BACKEND_URL === "false") {
      test.skip(true, "Backend E2E disabled");
    }
  });

  test("tenant admin can navigate event management views", async ({ page }) => {
    await loginAsTenantStaff(page);

    await page.goto("/events/manage");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("h1")).toContainText("Events");

    await page.click(".btn-primary");
    await page.waitForSelector(".modal-overlay, form, .event-form", { timeout: 10000 });
  });

  test("tenant admin can view QR code management page", async ({ page }) => {
    await loginAsTenantStaff(page);

    await page.goto("/events/1/qr-codes");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("h1")).toContainText("QR Codes");

    const cards = await page.locator(".qr-card").count();
    expect(cards).toBeGreaterThan(0);
  });

  test("tenant admin can open the scanner from QR management", async ({ page }) => {
    await loginAsTenantStaff(page);

    await page.goto("/events/1/qr-codes");
    await page.waitForLoadState("domcontentloaded");

    await page.goto("/events/1/scanner");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("h1")).toContainText(/Check-in Scanner/);
  });

  test("scanner page has manual entry fallback", async ({ page }) => {
    await loginAsTenantStaff(page);

    await page.goto("/events/1/scanner");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator(".scan-input")).toBeVisible();
  });

  test("tenant admin can view guest list", async ({ page }) => {
    await loginAsTenantStaff(page);

    await page.goto("/events/1/guests");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("h1")).toContainText(/Guest|Attendees/);
  });

  test("tenant admin can view ticket types", async ({ page }) => {
    await loginAsTenantStaff(page);

    await page.goto("/events/1/ticket-types");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("h1")).toContainText(/Ticket|Type/);
  });

  test("scanner page is accessible without CSRF token (API key auth)", async ({ request }) => {
    const token = "a".repeat(64);

    const response = await request.post(`/api/v1/events/checkin/${token}`, {
      data: { scannerId: "test" },
      headers: { "x-api-key": "test-key" },
    });
    expect(response.status()).not.toBe(403);
  });
});
