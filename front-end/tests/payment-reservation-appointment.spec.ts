import { test, expect } from "@playwright/test";
import { loginAsPlatformAdmin, loginAsTenantStaff } from "./fixtures";

const requiresBackend = process.env.E2E_BACKEND_URL !== "false";

test.describe("Payment, reservation, and salon appointment flows", () => {
  test.beforeEach(async ({ page }) => {
    if (!requiresBackend) {
      test.skip(true, "Requires running backend");
    }
  });

  test.describe("Reservation flow", () => {
    test("tenant staff can navigate to reservations and see the reservations page", async ({ page }) => {
      await loginAsTenantStaff(page);
      await page.goto("/reservations");
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveURL(/\/reservations/);
      const heading = page.getByRole("heading", { name: /reservations/i });
      await expect(heading).toBeVisible();
    });

    test("tenant staff can access new reservation form", async ({ page }) => {
      await loginAsTenantStaff(page);
      await page.goto("/new-reservation");
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveURL(/\/new-reservation/);
      const formHeading = page.getByRole("heading", { name: /new reservation|book a table/i });
      await expect(formHeading).toBeVisible();
    });
  });

  test.describe("Payment flow", () => {
    test("tenant staff can navigate to payments dashboard", async ({ page }) => {
      await loginAsTenantStaff(page);
      await page.goto("/payments");
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveURL(/\/payments/);
      const heading = page.getByRole("heading", { name: /payments/i });
      await expect(heading).toBeVisible();
    });

    test("platform admin can access financial settings", async ({ page }) => {
      await loginAsPlatformAdmin(page);
      await page.goto("/admin/settings");
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveURL(/\/admin\/settings/);
      const paymentSection = page.getByText(/payment|paystack|billing/i);
      await expect(paymentSection.first()).toBeVisible();
    });
  });

  test.describe("Salon appointment flow", () => {
    test("tenant staff can navigate to salon appointments", async ({ page }) => {
      const hasSalonTenant = process.env.E2E_SALON_TENANT_ENABLED === "true";

      if (!hasSalonTenant) {
        test.skip(true, "Requires seeded salon tenant and running backend");
        return;
      }

      await loginAsTenantStaff(page);
      await page.goto("/appointments");
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveURL(/\/appointments/);
      const heading = page.getByRole("heading", { name: /appointments/i });
      await expect(heading).toBeVisible();
    });

    test("salon staff can access salon services", async ({ page }) => {
      const hasSalonTenant = process.env.E2E_SALON_TENANT_ENABLED === "true";

      if (!hasSalonTenant) {
        test.skip(true, "Requires seeded salon tenant and running backend");
        return;
      }

      await loginAsTenantStaff(page);
      await page.goto("/salon/services");
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveURL(/\/salon\/services/);
      const heading = page.getByRole("heading", { name: /services/i });
      await expect(heading).toBeVisible();
    });
  });
});
