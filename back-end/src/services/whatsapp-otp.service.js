const crypto = require("crypto");
const { cache } = require("../utils/cache");

const OTP_PREFIX = "wa_otp";
const OTP_TTL = 300;
const OTP_ATTEMPT_PREFIX = "wa_otp:attempts";
const OTP_ATTEMPT_LIMIT = 5;
const OTP_ATTEMPT_WINDOW = 900;

const generateCode = () => {
  return String(crypto.randomInt(100000, 999999));
};

const hashCode = (code) => {
  return crypto.createHash("sha256").update(code).digest("hex");
};

const generateOTP = async (userId, phone, tenantId) => {
  const code = generateCode();
  const key = `${OTP_PREFIX}:${userId}`;
  const payload = {
    hash: hashCode(code),
    phone,
    tenantId,
    createdAt: Date.now(),
  };

  await cache.set(key, payload, OTP_TTL);
  await cache.del(`${OTP_ATTEMPT_PREFIX}:${userId}`);

  return code;
};

const verifyOTP = async (userId, code) => {
  const key = `${OTP_PREFIX}:${userId}`;
  const entry = await cache.get(key);

  if (!entry) {
    return { valid: false, reason: "expired_or_missing" };
  }

  const attemptsKey = `${OTP_ATTEMPT_PREFIX}:${userId}`;
  const attempts = await cache.get(attemptsKey);
  const attemptCount = attempts ? attempts.count : 0;

  if (attemptCount >= OTP_ATTEMPT_LIMIT) {
    await cache.del(key);
    return { valid: false, reason: "too_many_attempts" };
  }

  const inputHash = hashCode(code);
  const matches = inputHash === entry.hash;

  if (matches) {
    await cache.del(key);
    await cache.del(attemptsKey);
    return { valid: true };
  }

  await cache.set(attemptsKey, { count: attemptCount + 1 }, OTP_ATTEMPT_WINDOW);
  return { valid: false, reason: "invalid_code" };
};

const clearOTP = async (userId) => {
  await cache.del(`${OTP_PREFIX}:${userId}`);
  await cache.del(`${OTP_ATTEMPT_PREFIX}:${userId}`);
};

module.exports = {
  generateOTP,
  verifyOTP,
  clearOTP,
};
