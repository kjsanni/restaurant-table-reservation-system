const { isTenantModeEnabled } = require("../utils/tenantMode");

const requireActiveTenant = async (req, res, next) => {
  if (!(await isTenantModeEnabled())) {
    return next();
  }

  const tenant = req.tenant;
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
  if (!tenant) {
    if (NO_TENANT_REQUIRED_PATHS.some((p) => req.path === p || req.path.startsWith(p + "/"))) {
      // Safe to continue without tenant activation check for the same reasons documented in resolveTenant.js
      return next();
    }
    return res.status(500).json({
      success: false,
      message: "Tenant not resolved before request.",
    });
  }

  if (tenant.status === "cancelled") {
    return res.status(403).json({
      success: false,
      message: "Subscription cancelled. Contact support to restore access.",
    });
  }

  if (tenant.status === "suspended") {
    return res.status(403).json({
      success: false,
      message: `Account suspended: ${tenant.suspendedReason || "Payment issue"}`,
    });
  }

  if (tenant.status === "past_due") {
    if (tenant.graceEndsAt && new Date(tenant.graceEndsAt) < new Date()) {
      return res.status(403).json({
        success: false,
        message: "Payment overdue. Please update billing to continue.",
      });
    }
  }

  next();
};

module.exports = { requireActiveTenant };
