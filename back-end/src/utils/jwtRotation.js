const jwt = require("jsonwebtoken");

const getCurrentSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable must be set");
  }
  if (secret.length < 32) {
    throw new Error("JWT_SECRET must be at least 256 bits (32 characters)");
  }
  return secret;
};

const getPreviousSecret = () => {
  return process.env.JWT_SECRET_PREVIOUS || null;
};

const verifyTokenWithFallback = (token) => {
  const currentSecret = getCurrentSecret();
  const previousSecret = getPreviousSecret();

  try {
    return jwt.verify(token, currentSecret, { clockTolerance: 30 });
  } catch (err) {
    if (previousSecret && err.name === "TokenExpiredError") {
      try {
        return jwt.verify(token, previousSecret, { clockTolerance: 30 });
      } catch (fallbackErr) {
        throw err;
      }
    }
    if (previousSecret && (err.name === "JsonWebTokenError" || err.name === "NotBeforeError")) {
      try {
        return jwt.verify(token, previousSecret, { clockTolerance: 30 });
      } catch (fallbackErr) {
        throw err;
      }
    }
    throw err;
  }
};

module.exports = {
  getCurrentSecret,
  getPreviousSecret,
  verifyTokenWithFallback,
};
