const { isTenantModeEnabled } = require("../utils/tenantMode");

const requireActiveTenant = async (req, res, next) => {
  if (!(await isTenantModeEnabled())) {
    return next();
  }

  const tenant = req.tenant;
  const PLATFORM_ADMIN_PATHS = ["/api/v1/admin/tenants", "/api/v1/billing", "/api/v1/public/dsar-request"];
  if (!tenant) {
    if (PLATFORM_ADMIN_PATHS.some((p) => req.path === p || req.path.startsWith(p + "/"))) {
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
