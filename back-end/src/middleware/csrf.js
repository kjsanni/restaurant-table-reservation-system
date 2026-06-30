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
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "lax" : false,
      path: "/",
      maxAge: 24 * 60 * 60 * 1000,
    });
  }
  next();
};

const validateCsrfToken = (req, res, next) => {
  const method = req.method.toLowerCase();
  if (["get", "head", "options"].includes(method)) {
    return next();
  }

  const clientToken = req.headers[CSRF_HEADER_NAME.toLowerCase()];
  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];

  if (!clientToken || !cookieToken || clientToken !== cookieToken) {
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
