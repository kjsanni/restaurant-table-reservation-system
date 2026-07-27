const db = require("../../db/models");

const paystackConfigDAO = {};

paystackConfigDAO.getConfig = async () => {
  const setting = await db.setting.findOne({ where: { key: "paystack_config" } });
  if (!setting) return { secretKey: null, webhookSecret: null, mode: "test", rotatedAt: null, previousSecretKey: null };
  const value = typeof setting.value === "string" ? JSON.parse(setting.value) : setting.value;
  return {
    secretKey: value.secretKey || null,
    webhookSecret: value.webhookSecret || null,
    mode: value.mode || "test",
    rotatedAt: value.rotatedAt || null,
    previousSecretKey: value.previousSecretKey || null,
  };
};

paystackConfigDAO.updateConfig = async (payload) => {
  const existing = await db.setting.findOne({ where: { key: "paystack_config" } });
  const current = existing
    ? typeof existing.value === "string"
      ? JSON.parse(existing.value)
      : existing.value
    : {};

  const next = { ...current, ...payload };
  if (existing) {
    await existing.update({ value: next });
    return existing;
  }
  return await db.setting.create({ key: "paystack_config", value: next, description: "Platform-level Paystack API credentials" });
};

module.exports = paystackConfigDAO;
