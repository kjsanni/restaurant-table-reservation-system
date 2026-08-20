"use strict";

const { protect, requireSuperAdmin } = require("./auth");
const ipAllowlist = require("./ipAllowlist");

const adminOrPlatformMiddleware = (req, res, next) => {
  ipAllowlist(req, res, () => {
    protect(req, res, () => {
      if (req.user?.isSuperAdmin) {
        return requireSuperAdmin(req, res, next);
      }

      const userPermissions = req.user?.permissions || {};
      if (userPermissions.manage_tenants) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: "Permission denied: manage_tenants or super-admin required!",
      });
    });
  });
};

module.exports = { adminOrPlatformMiddleware };
