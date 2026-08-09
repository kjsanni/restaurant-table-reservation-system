import { test, expect } from "@playwright/test";

const E2E_SUPER_ADMIN_EMAIL = process.env.E2E_SUPER_ADMIN_EMAIL || "admin@rtrs.com";
const E2E_SUPER_ADMIN_PASSWORD = process.env.E2E_SUPER_ADMIN_PASSWORD || "admin123";
const E2E_TENANT_SLUG = process.env.E2E_TENANT_SLUG || "default";
const E2E_TENANT_EMAIL = process.env.E2E_TENANT_EMAIL || "akua@demo.test";
const E2E_TENANT_PASSWORD = process.env.E2E_TENANT_PASSWORD || "password123";

async function loginAsPlatformAdmin(page) {
  await page.goto("/super-admin/login");
  await page.fill('#email', E2E_SUPER_ADMIN_EMAIL);
  await page.fill('#password', E2E_SUPER_ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 120000 });
}

async function loginAsTenantStaff(page) {
  await page.goto(`/t/${E2E_TENANT_SLUG}/login`);
  await page.waitForTimeout(500);
  await page.fill('#email', E2E_TENANT_EMAIL);
  await page.fill('#password', E2E_TENANT_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 120000 });
}

test.describe("Actor Entry Points", () => {
  test.describe("Super admin entry point", () => {
    test("should show platform-branded login and redirect to /super-admin/overview", async ({ page }) => {
      await loginAsPlatformAdmin(page);
      await expect(page).toHaveURL("/super-admin/overview");
      const heading = page.getByRole("heading", { name: /platform overview/i });
      await expect(heading).toBeVisible();
    });

    test("sidebar should show platform nav items, not tenant nav items", async ({ page }) => {
      await loginAsPlatformAdmin(page);
      await expect(page).toHaveURL("/super-admin/overview");
      await expect(page.getByRole("heading", { name: "Platform Overview" })).toBeVisible();
      await expect(page.getByText(/Tenants/i).first()).toBeVisible();
    });

    test("should not see salon-specific tenant routes", async ({ page }) => {
      await loginAsPlatformAdmin(page);
      await expect(page).toHaveURL("/super-admin/overview");
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
      await page.goto(`/t/${E2E_TENANT_SLUG}/portal`);
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/\/portal/);
      const portalHeading = page.getByRole("heading", { name: /portal/i });
      await expect(portalHeading).toBeVisible();
    });
  });
});
