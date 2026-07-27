const speakeasy = require("speakeasy");

const generateSecret = () => {
  return speakeasy.generateSecret({
    name: `RTRS Super Admin (${process.env.APP_NAME || "Platform"})`,
    issuer: process.env.APP_NAME || "RTRS Platform",
  });
};

const verifyTOTP = (secret, token) => {
  if (!secret || !token) return false;
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window: 2,
  });
};

const getTOTPUri = (secret) => {
  if (!secret || !secret.otpauth_url) return null;
  return secret.otpauth_url;
};

module.exports = {
  generateSecret,
  verifyTOTP,
  getTOTPUri,
};
