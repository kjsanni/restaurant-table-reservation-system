"use strict";

const crypto = require("crypto");
const authDAO = require("../../../DAOs/auth.dao");
const logger = require("../../../utils/logger");

const validateScannerApiKey = async (req, res, next) => { // codacy-suppress method-length
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: "MISSING_API_KEY",
      message: "Missing X-API-Key header",
    });
  }

  const tenantId = req.tenant?.id;
  if (!tenantId) {
    return res.status(400).json({
      success: false,
      error: "MISSING_TENANT",
      message: "Missing tenant context",
    });
  }

  try {
    const scannerConfig = await authDAO.getSettingValue(
      "event_checkin_config",
      { scannerApiKey: null, geofenceRadiusMeters: 50, scanRateLimit: 5 },
      tenantId
    );

    if (!scannerConfig || !scannerConfig.scannerApiKey) {
      logger.error("Event check-in scanner API key not configured", { tenantId });
      return res.status(403).json({
        success: false,
        error: "SCANNER_NOT_CONFIGURED",
        message: "Check-in scanner not configured for this tenant",
      });
    }

    const storedKey = String(scannerConfig.scannerApiKey);
    const providedKey = String(apiKey);

    let matches = false;
    try {
      matches =
        providedKey.length === storedKey.length &&
        crypto.timingSafeEqual(Buffer.from(providedKey), Buffer.from(storedKey));
    } catch {
      matches = false;
    }

    if (!matches) {
      logger.warn("Invalid scanner API key", { tenantId });
      return res.status(403).json({
        success: false,
        error: "INVALID_API_KEY",
        message: "Invalid check-in scanner API key",
      });
    }

    req.scanner = { tenantId, validated: true };
    next();
  } catch (err) {
    logger.error("Scanner API key validation failed", { tenantId, error: err.message });
    return res.status(500).json({
      success: false,
      error: "AUTH_ERROR",
      message: "Authentication check failed",
    });
  }
};

module.exports = { validateScannerApiKey };
