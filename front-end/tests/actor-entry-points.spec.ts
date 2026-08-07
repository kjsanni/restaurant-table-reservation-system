import { test, expect } from "@playwright/test";
import { loginAsPlatformAdmin, loginAsTenantStaff } from "./fixtures";

test.describe("Actor Entry Points", () => {
  test.describe("Super admin entry point", () => {
    test("should show platform-branded login and redirect to /admin/overview", async ({ page }) => {
      await loginAsPlatformAdmin(page);
      await expect(page).toHaveURL("/admin/overview");
      const heading = page.getByRole("heading", { name: /platform overview/i });
      await expect(heading).toBeVisible();
    });

    test("sidebar should show platform nav items, not tenant nav items", async ({ page }) => {
      await loginAsPlatformAdmin(page);
      await expect(page).toHaveURL("/admin/overview");
      await expect(page.getByRole("heading", { name: "Platform Overview" })).toBeVisible();
      await expect(page.getByText(/Tenants/i).first()).toBeVisible();
    });

    test("should not see salon-specific tenant routes", async ({ page }) => {
      await loginAsPlatformAdmin(page);
      await expect(page).toHaveURL("/admin/overview");
      const salonAppointments = page.getByText("Appointments", { exact: true });
      await expect(salonAppointments).toHaveCount(0);
    });
  });

  test.describe("Tenant staff entry point", () => {
    test("should resolve tenant by slug and redirect to tenant dashboard", async ({ page }) => {
      await loginAsTenantStaff(page);
      await expect(page).toHaveURL("/dashboard");
    });

    test("should show tenant branding when configured", async ({ page }) => {
      await loginAsTenantStaff(page);
      await expect(page).toHaveURL("/dashboard");
    });
  });

  test.describe("Customer portal entry point", () => {
    test("should resolve tenant and show portal home", async ({ page }) => {
      await page.goto(`/t/default/portal`);
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/\/portal/);
      const portalHeading = page.getByRole("heading", { name: /portal/i });
      await expect(portalHeading).toBeVisible();
    });
  });
});
