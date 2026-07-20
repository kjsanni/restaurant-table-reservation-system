const otpStore = new Map();

const setOtp = (phone, code, customerId, ttlMs = 5 * 60 * 1000) => {
  const entry = { code, customerId, expiresAt: Date.now() + ttlMs };
  otpStore.set(phone, entry);
  return entry;
};

const getOtp = (phone) => {
  const entry = otpStore.get(phone);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(phone);
    return null;
  }
  return entry;
};

const clearOtp = (phone) => {
  otpStore.delete(phone);
};

module.exports = {
  setOtp,
  getOtp,
  clearOtp,
};
