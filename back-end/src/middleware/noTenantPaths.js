const NO_TENANT_REQUIRED_PATHS = [
  "/api/v1/admin/tenants",
  "/api/v1/admin/plans",
  "/api/v1/admin/payments",
  "/api/v1/admin/usage",
  "/api/v1/admin/revenue",
  "/api/v1/admin/bulk",
  "/api/v1/admin/billing-emails",
  "/api/v1/admin/audit",
  "/api/v1/admin/notifications",
  "/api/v1/billing",
  "/api/v1/public/dsar-request",
  "/api/v1/public/tenants",
  "/api/v1/health",
  "/api/v1/auth/login",
  "/api/v1/auth/register",
  "/api/v1/auth/register/customer",
  "/api/v1/auth/register/status",
  "/api/v1/auth/forgot-password",
  "/api/v1/auth/reset-password",
  "/api/v1/auth/turnstile-config",
  "/api/v1/auth/me",
  "/api/v1/auth/refresh-token",
  "/api/v1/auth/logout",
  "/api/v1/auth/settings",
  "/api/v1/auth/tenant/capabilities",
  "/api/v1/admin/feature-flags",
  "/api/v1/admin/feature-flags/global",
  "/api/v1/admin/feature-flags/tenants",
];

const isNoTenantRequired = (path) =>
  NO_TENANT_REQUIRED_PATHS.some((p) => path === p || path.startsWith(p + "/"));

module.exports = {
  NO_TENANT_REQUIRED_PATHS,
  isNoTenantRequired,
};
