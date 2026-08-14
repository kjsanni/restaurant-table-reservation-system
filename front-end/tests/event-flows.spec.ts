import { test, expect } from "@playwright/test";
import {
  loginAsPlatformAdmin,
  loginAsTenantStaff,
  E2E_TENANT_SLUG,
} from "./fixtures";

const E2E_CUSTOMER_EMAIL =
  process.env.E2E_CUSTOMER_EMAIL || "customer@demo.test";
const E2E_CUSTOMER_PASSWORD =
  process.env.E2E_CUSTOMER_PASSWORD || "customer123";

async function loginAsCustomer(page) {
  await page.goto("/customer/login");
  await page.waitForLoadState("domcontentloaded");
  await page.fill("#email", E2E_CUSTOMER_EMAIL);
  await page.fill("#password", E2E_CUSTOMER_PASSWORD);
  await page.press("#password", "Enter");
  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 120000,
  });
}

test.describe("Event flows", () => {
  test.beforeEach(async ({ page }) => {
    if (process.env.E2E_BACKEND_URL === "false") {
      test.skip(true, "Backend E2E disabled");
    }
  });

  test.describe("Customer event portal", () => {
    test("customer can browse events and view event details", async ({
      page,
    }) => {
      await loginAsCustomer(page);

      await page.goto("/portal/events");
      await page.waitForLoadState("domcontentloaded");

      const eventCards = page.locator(".event-card");
      if ((await eventCards.count()) > 0) {
        await eventCards.first().click();
        await page.waitForURL((url) =>
          url.pathname.includes("/portal/events/")
        );
        await expect(page.locator("h1")).toContainText(/.*/);
      } else {
        await expect(page.locator(".empty-state")).toBeVisible();
      }
    });

    test("customer can book a free event", async ({ page }) => {
      await loginAsCustomer(page);

      await page.goto("/portal/events");
      await page.waitForLoadState("domcontentloaded");

      const freeEvent = page.locator(".event-card").first();
      if ((await freeEvent.count()) > 0) {
        await freeEvent.click();
        await page.waitForURL((url) =>
          url.pathname.includes("/portal/events/")
        );

        const bookButton = page.locator(".book-btn").first();
        if ((await bookButton.count()) > 0 && (await bookButton.isEnabled())) {
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
      if ((await eventRow.count()) > 0) {
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
      await expect(page.locator("h1")).toContainText("Events");
    });

    test("super-admin can view wallet pass requests tab", async ({ page }) => {
      await loginAsPlatformAdmin(page);

      await page.goto("/super-admin/events");
      await page.waitForLoadState("domcontentloaded");

      const walletPassTab = page.locator(".tab", {
        hasText: "Wallet Pass Requests",
      });
      await expect(walletPassTab).toBeVisible();

      await walletPassTab.click();
      const requestsTable = page.locator(".data-table");
      await expect(requestsTable).toBeVisible();

      const headerCells = await page
        .locator(".data-table thead th")
        .allTextContents();
      expect(headerCells).toContain("Status");
      expect(headerCells).toContain("Actions");
    });

    test("super-admin can view wallet pass request details", async ({
      page,
    }) => {
      await loginAsPlatformAdmin(page);

      await page.goto("/super-admin/events");
      await page.waitForLoadState("domcontentloaded");

      await page.locator(".tab", { hasText: "Wallet Pass Requests" }).click();
      await page.waitForLoadState("domcontentloaded");

      const firstRow = page.locator(".data-table tbody tr").first();
      if ((await firstRow.count()) > 0) {
        await firstRow.click();
        const approveButton = page.locator(".btn-primary", {
          hasText: "Approve",
        });
        const rejectButton = page.locator(".btn-danger", { hasText: "Reject" });
        const anyAction =
          (await approveButton.count()) > 0 || (await rejectButton.count()) > 0;
        expect(anyAction).toBe(true);
      } else {
        const emptyState = page.locator(".empty-state");
        await expect(emptyState).toBeVisible();
      }
    });
  });

  test.describe("Customer wallet pass payment flow", () => {
    test("customer can view wallet pass section on event detail", async ({
      page,
    }) => {
      await loginAsCustomer(page);

      await page.goto("/portal/events");
      await page.waitForLoadState("domcontentloaded");

      const eventCard = page.locator(".event-card").first();
      if ((await eventCard.count()) > 0) {
        await eventCard.click();
        await page.waitForURL((url) =>
          url.pathname.includes("/portal/events/")
        );

        const walletSection = page.locator(".wallet-pass-section");
        await expect(walletSection).toBeVisible();
        await expect(page.locator(".wallet-pass-btn")).toBeVisible();
      } else {
        await expect(page.locator(".empty-state")).toBeVisible();
      }
    });

    test("customer can navigate to wallet pass view from event detail", async ({
      page,
    }) => {
      await loginAsCustomer(page);

      await page.goto("/portal/events");
      await page.waitForLoadState("domcontentloaded");

      const eventCard = page.locator(".event-card").first();
      if ((await eventCard.count()) > 0) {
        await eventCard.click();
        await page.waitForURL((url) =>
          url.pathname.includes("/portal/events/")
        );

        const walletBtn = page.locator(".wallet-pass-btn").first();
        if ((await walletBtn.count()) > 0) {
          await walletBtn.click();
          await page.waitForURL((url) => url.pathname.includes("/wallet-pass"));
          await expect(page.locator("h1, h2, h3").first()).toBeVisible();
        }
      }
    });

    test("customer sees confirmation after paying for wallet pass", async ({
      page,
    }) => {
      await loginAsCustomer(page);

      await page.goto("/portal/events/1?paid=true&booking=1");
      await page.waitForLoadState("domcontentloaded");

      const confirmationSection = page.locator(".confirmation-section");
      await expect(confirmationSection).toBeVisible();
      await expect(page.locator(".wallet-pass-btn")).toBeVisible();

      await page.locator(".wallet-pass-btn").click();
      await page.waitForURL((url) => url.pathname.includes("/wallet-pass"));
    });
  });
});
