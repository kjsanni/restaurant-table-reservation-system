"use strict";

const { getFeatureFlag, hasServiceMode } = require("../services/tenantTypeDefaults.service");

const requiredFeature = (feature) => {
  return (req, res, next) => {
    if (!req.tenant) {
      return res.status(400).json({ success: false, message: "Tenant context required" });
    }

    if (!getFeatureFlag(req.tenant, feature)) {
      return res.status(404).json({
        success: false,
        message: "Feature not enabled for this tenant",
      });
    }

    next();
  };
};

const requiresServiceMode = (mode) => {
  return (req, res, next) => {
    if (!req.tenant) {
      return res.status(400).json({ success: false, message: "Tenant context required" });
    }

    if (!hasServiceMode(req.tenant, mode)) {
      return res.status(404).json({
        success: false,
        message: `${mode} service is not enabled for this tenant`,
      });
    }

    next();
  };
};

module.exports = {
  requiredFeature,
  requiresServiceMode,
};
