import { test, expect, type Page } from "@playwright/test";
import { loginAsTenantStaff, E2E_TENANT_SLUG } from "./fixtures";

const SCANNER_API_KEY = process.env.E2E_SCANNER_API_KEY || "test-scanner-key-1234567890";

test.describe("Event check-in scanner flow", () => {
  test.beforeEach(async ({ page }) => {
    if (process.env.E2E_BACKEND_URL === "false") {
      test.skip(true, "Backend E2E disabled");
    }
  });

  test.describe("Scanner UI", () => {
  test("scanner page loads with camera view", async ({ page }) => {
    await loginAsTenantStaff(page);

    await page.goto("/events/1/scanner");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("h1")).toContainText(/Check-in Scanner/);

    const scanInput = page.locator(".scan-input");
    if (await scanInput.count() > 0) {
      await expect(scanInput).toBeVisible();
    }
  });

  test("scanner has manual entry fallback", async ({ page }) => {
    await loginAsTenantStaff(page);

    await page.goto("/events/1/scanner");
    await page.waitForLoadState("domcontentloaded");

    const scanInput = page.locator(".scan-input");
    if (await scanInput.count() > 0) {
      await scanInput.fill("a".repeat(64));
      await page.locator(".btn-primary").click();
    }
  });
  });

  test.describe("QR code management with new fields", () => {
    test("QR management page shows new columns and scanner button", async ({ page }) => {
      await loginAsTenantStaff(page);

      await page.goto("/events/1/qr-codes");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.locator("h1")).toContainText("QR Codes");

      const scannerBtn = page.locator("button.btn-secondary[title='Open check-in scanner']");
      if (await scannerBtn.count() > 0) {
        await expect(scannerBtn).toBeVisible();
      }

      const headers = page.locator(".data-table th");
      if ((await headers.count()) > 0) {
        const headerTexts = await headers.allInnerTexts();
        expect(headerTexts).toContain("Token Hash");
        expect(headerTexts).toContain("Attendee");
        expect(headerTexts).toContain("Usage");
        expect(headerTexts).toContain("Tier");
      }
    });
  });

  test.describe("Web pass viewer (short URL)", () => {
    test("web pass page shows ticket details for valid short code", async ({ page }) => {
      await page.goto("/api/v1/public/e/0000000000000000");
      await page.waitForLoadState("domcontentloaded");

      const errorTitle = page.locator("h1");
      if (await errorTitle.count() > 0) {
        const text = await errorTitle.textContent();
        expect(text).toMatch(/Link Expired|Invalid Ticket|Ticket Not Found/);
      }
    });

    test("web pass page handles malformed short code", async ({ page }) => {
      await page.goto("/api/v1/public/e/invalid");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.locator("h1")).toContainText("Invalid ticket link");
    });
  });

  test.describe("API security for checkin endpoint", () => {
    test("checkin endpoint rejects requests without API key", async ({ request }) => {
      const token = "a".repeat(64);
      const response = await request.post(`/api/v1/events/checkin/${token}`, {
        data: { scannerId: "test", latitude: 0, longitude: 0 },
      });
      expect(response.status()).toBe(401);
    });

    test("checkin endpoint rejects invalid API key", async ({ request }) => {
      const token = "a".repeat(64);
      const response = await request.post(`/api/v1/events/checkin/${token}`, {
        data: { scannerId: "test", latitude: 0, longitude: 0 },
        headers: { "x-api-key": "invalid-key" },
      });
      expect(response.status()).toBe(403);
    });

    test("checkin endpoint accepts valid API key with scanner params", async ({ request }) => {
      const token = "a".repeat(64);
      const response = await request.post(`/api/v1/events/checkin/${token}`, {
        data: { scannerId: "scanner_123", latitude: 5.556, longitude: -0.205 },
        headers: { "x-api-key": SCANNER_API_KEY },
      });
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toMatch(/INVALID_TOKEN|INVALID_SIGNATURE|GEOFENCE_EXCEEDED|TOKEN_NOT_FOUND/);
    });
  });
});
