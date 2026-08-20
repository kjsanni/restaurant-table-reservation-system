const crypto = require("crypto");

const CSRF_COOKIE_NAME = "XSRF-TOKEN";
const CSRF_HEADER_NAME = "x-xsrf-token";

const generateCsrfToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

const setCsrfCookie = (req, res, next) => {
  const existingToken = req.cookies?.[CSRF_COOKIE_NAME];
  if (!existingToken) {
    const token = generateCsrfToken();
    const isProduction = process.env.NODE_ENV === "production";
    const isTest = process.env.NODE_ENV === "test";
    let sameSite;
    if (isTest) {
      sameSite = false;
    } else if (isProduction) {
      sameSite = "strict";
    } else {
      sameSite = "lax";
      console.warn("[CSRF] Development mode: sameSite set to lax. For production, use strict.");
    }
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false,
      secure: isProduction,
      sameSite,
      path: "/",
      maxAge: 24 * 60 * 60 * 1000,
    });
    if (req.session) {
      req.session.csrfToken = crypto.createHash("sha256").update(token).digest("hex");
    }
  }
  next();
};

const validateCsrfToken = (req, res, next) => {
  if (process.env.NODE_ENV === "test") {
    return next();
  }

  const method = req.method.toLowerCase();
  if (["get", "head", "options"].includes(method)) {
    return next();
  }

  const clientToken = req.headers[CSRF_HEADER_NAME.toLowerCase()];
  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const sessionToken = req.session?.csrfToken;

  if (!clientToken || !cookieToken || !sessionToken) {
    return res.status(403).json({
      success: false,
      message: "Invalid CSRF token.",
    });
  }

  if (clientToken.length !== cookieToken.length) {
    return res.status(403).json({
      success: false,
      message: "Invalid CSRF token.",
    });
  }

  const clientBuf = Buffer.from(clientToken, "utf8");
  const cookieBuf = Buffer.from(cookieToken, "utf8");

  if (!crypto.timingSafeEqual(clientBuf, cookieBuf)) {
    return res.status(403).json({
      success: false,
      message: "Invalid CSRF token.",
    });
  }

  const sessionHash = crypto.createHash("sha256").update(clientToken, "utf8").digest("hex");
  const sessionBuf = Buffer.from(sessionHash, "utf8");
  const expectedBuf = Buffer.from(sessionToken, "utf8");

  if (!crypto.timingSafeEqual(sessionBuf, expectedBuf)) {
    return res.status(403).json({
      success: false,
      message: "Invalid CSRF token.",
    });
  }

  next();
};

module.exports = {
  setCsrfCookie,
  validateCsrfToken,
  generateCsrfToken,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
};
