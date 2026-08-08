import { test as base } from "@playwright/test";

const E2E_SUPER_ADMIN_EMAIL =
  process.env.E2E_SUPER_ADMIN_EMAIL || "admin@rtrs.com";
const E2E_SUPER_ADMIN_PASSWORD =
  process.env.E2E_SUPER_ADMIN_PASSWORD || "admin123";
const E2E_TENANT_SLUG = process.env.E2E_TENANT_SLUG || "default";
const E2E_TENANT_EMAIL = process.env.E2E_TENANT_EMAIL || "akua@demo.test";
const E2E_TENANT_PASSWORD =
  process.env.E2E_TENANT_PASSWORD || "password123";

async function loginAsPlatformAdmin(page) {
  await page.goto("/super-admin/login");
  await page.fill("#email", E2E_SUPER_ADMIN_EMAIL);
  await page.fill("#password", E2E_SUPER_ADMIN_PASSWORD);
  await page.press("#password", "Enter");
  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 60000,
  });
}

async function loginAsTenantStaff(page) {
  await page.goto(`/t/${E2E_TENANT_SLUG}/login`);
  await page.waitForTimeout(500);
  await page.fill("#email", E2E_TENANT_EMAIL);
  await page.fill("#password", E2E_TENANT_PASSWORD);
  await page.press("#password", "Enter");
  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 60000,
  });
}

export const test = base.extend({
  loginAsPlatformAdmin: [
    async ({ page }, use) => {
      await use(loginAsPlatformAdmin(page));
    },
  ],
  loginAsTenantStaff: [
    async ({ page }, use) => {
      await use(loginAsTenantStaff(page));
    },
  ],
});

export {
  loginAsPlatformAdmin,
  loginAsTenantStaff,
  E2E_SUPER_ADMIN_EMAIL,
  E2E_SUPER_ADMIN_PASSWORD,
  E2E_TENANT_SLUG,
  E2E_TENANT_EMAIL,
  E2E_TENANT_PASSWORD,
};
