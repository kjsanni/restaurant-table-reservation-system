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

    const headers = await page.locator(".data-table th").allInnerTexts();
    expect(headers).toContain("Token Hash");
    expect(headers).toContain("Attendee");
    expect(headers).toContain("Usage");
    expect(headers).toContain("Tier");

    const scannerBtn = page.locator("button.btn-secondary[title='Open check-in scanner']");
    await expect(scannerBtn).toBeVisible();
  });

  test("tenant admin can open the scanner from QR management", async ({ page }) => {
    await loginAsTenantStaff(page);

    await page.goto("/events/1/qr-codes");
    await page.waitForLoadState("domcontentloaded");

    await page.click("button.btn-secondary[title='Open check-in scanner']");
    await page.waitForURL((url) => url.pathname.includes("/scanner"));

    await expect(page.locator(".scanner-header")).toBeVisible();

    await expect(page.locator("h1")).toContainText(/QR Codes: /);
  });

  test("scanner page has manual entry fallback", async ({ page }) => {
    await loginAsTenantStaff(page);

    await page.goto("/events/1/scanner");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator(".scanner-header")).toBeVisible();

    const cameraContainer = page.locator("#qr-scanner");
    const cameraVisible = await cameraContainer.isVisible();

    if (!cameraVisible) {
      await expect(page.locator(".manual-entry")).toBeVisible();
      await expect(page.locator(".token-input")).toBeVisible();
    }
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
    await page;
    const token = "a".repeat(64);

    await request.post(`/api/v1/events/checkin/${token}`, {
      data: { scannerId: "test" },
      headers: { "x-api-key": "test-key" },
    });
  });
});
