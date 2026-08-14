const NO_TENANT_REQUIRED_PATHS = [
  "/api/v1/admin",
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
];

const isNoTenantRequired = (path) =>
  NO_TENANT_REQUIRED_PATHS.some((p) => path === p || path.startsWith(p + "/"));

module.exports = {
  NO_TENANT_REQUIRED_PATHS,
  isNoTenantRequired,
};
