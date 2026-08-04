const axios = require("axios");
const authDAO = require("../DAOs/auth.dao");

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const getTurnstileConfig = async () => {
  const enabled = await authDAO.getPlatformSettingByKey("turnstile_enabled");
  const siteKey = await authDAO.getPlatformSettingByKey("turnstile_site_key");
  const secretKey = await authDAO.getPlatformSettingByKey("turnstile_secret_key");

  return {
    enabled: enabled?.value === true,
    siteKey: siteKey?.value || null,
    secretKey: secretKey?.value || null,
  };
};

const verifyTurnstileToken = async (token, remoteIp) => {
  const config = await getTurnstileConfig();

  if (!config.enabled || !config.secretKey) {
    return true;
  }

  if (!token) {
    return false;
  }

  try {
    const params = new URLSearchParams();
    params.append("secret", config.secretKey);
    params.append("response", token);
    if (remoteIp) {
      params.append("remoteip", remoteIp);
    }

    const response = await axios.post(TURNSTILE_VERIFY_URL, params, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 5000,
    });

    return response.data.success === true;
  } catch (error) {
    return false;
  }
};

const getTurnstileToken = (req) => {
  return req.body?.cfTurnstileToken || req.headers["cf-turnstile-response"];
};

const validateTurnstile = async (req, res, next) => {
  try {
    const config = await getTurnstileConfig();
    if (!config.enabled) {
      return next();
    }

    // codeql[js/user-controlled-bypass] Token is validated before use; empty/invalid tokens return 403.
    const token = getTurnstileToken(req);
    if (typeof token !== "string" || token.trim().length === 0) {
      return res.status(403).json({
        success: false,
        message: "Turnstile verification failed. Please complete the challenge.",
      });
    }

    const valid = await verifyTurnstileToken(token, req.ip || req.connection.remoteAddress);
    if (valid) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Turnstile verification failed. Please try again.",
    });
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Turnstile verification failed. Please try again.",
    });
  }
};

module.exports = validateTurnstile;
