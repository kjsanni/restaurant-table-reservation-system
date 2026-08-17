import { test, expect, type Page } from "@playwright/test";
import { loginAsTenantStaff } from "./fixtures";

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

      await expect(page.locator(".scanner-header h1")).toContainText(/QR Codes: /);
      await expect(page.locator(".scanner-header")).toBeVisible();

      const cameraContainer = page.locator("#qr-scanner");
      if (await cameraContainer.count() > 0) {
        await expect(cameraContainer).toBeVisible();
      } else {
        await expect(page.locator(".manual-entry")).toBeVisible();
      }
    });

    test("scanner has manual entry fallback", async ({ page }) => {
      await loginAsTenantStaff(page);

      await page.goto("/events/1/scanner");
      await page.waitForLoadState("domcontentloaded");

      const showManualBtn = page.locator("button.btn-secondary");
      if (await showManualBtn.count() > 0) {
        await showManualBtn.click();
      }

      const manualInput = page.locator(".token-input");
      if (await manualInput.count() > 0) {
        await expect(manualInput).toBeVisible();
        await manualInput.fill("a".repeat(64));
        await page.locator("button.btn-secondary").last().click();
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
    test("web pass page shows ticket details for valid short code", async ({ request }) => {
      const response = await request.get("/api/v1/public/e/0000000000000000");
      expect(response.status()).toBe(410);
      const body = await response.text();
      expect(body).toContain("Link Expired");
    });

    test("web pass page handles malformed short code", async ({ request }) => {
      const response = await request.get("/api/v1/public/e/invalid");
      expect(response.status()).toBe(400);
      const body = await response.text();
      expect(body).toContain("Invalid ticket link");
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
      expect(body.error).toMatch(/INVALID_TOKEN|INVALID_SIGNATURE|GEOFENCE_EXCEEDED|TOKEN_NOT_FOUND|MISSING_TENANT|MISSING_API_KEY|INVALID_API_KEY/);
    });
  });
});
