const axios = require("axios");
const db = require("../../db/models");
const { normalizeSettingValue } = require("../../utils/settings");
const CircuitBreaker = require("../../utils/circuitBreaker");

const PAYSTACK_BASE = "https://api.paystack.co";

const envSecretKey = process.env.PAYSTACK_SECRET_KEY;
const envWebhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET;
const envMode = process.env.PAYSTACK_MODE || "test";

let cachedConfig = null;
let configLoadedAt = 0;

const loadPaystackConfig = async () => {
  const now = Date.now();
  if (cachedConfig && now - configLoadedAt < 60000) return cachedConfig;

  let secretKey = envSecretKey;
  let webhookSecret = envWebhookSecret;
  let mode = envMode;

  try {
    const setting = await db.setting.findOne({ where: { key: "paystack_config" } });
    if (setting && setting.value) {
      const cfg = normalizeSettingValue(setting.value);
      if (cfg.secretKey) secretKey = cfg.secretKey;
      if (cfg.webhookSecret) webhookSecret = cfg.webhookSecret;
      if (cfg.mode) mode = cfg.mode;
    }
  } catch {
  }

  cachedConfig = { secretKey, webhookSecret, mode };
  configLoadedAt = now;
  return cachedConfig;
};

const buildClient = (secretKey) =>
  axios.create({
    baseURL: PAYSTACK_BASE,
    timeout: 10000,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
  });

const buildPlatformClient = async () => {
  const config = await loadPaystackConfig();
  return buildClient(config.secretKey);
};

const paystackRequest = async (method, path, payload = null) => {
  return CircuitBreaker.execute(
    "paystack",
    async () => {
      const client = await buildPlatformClient();
      let response;
      if (method === "get") {
        response = await client.get(path);
      } else if (method === "post") {
        response = await client.post(path, payload);
      } else {
        throw new Error(`Unsupported HTTP method: ${method}`);
      }
      return response.data.data;
    },
    { failureThreshold: 5, recoveryTimeout: 30000 }
  );
};

const validateSecretKey = async (secretKey) => {
  const client = buildClient(secretKey);
  try {
    await client.get("/transaction/verify/fake-reference-for-validation");
    return true;
  } catch (err) {
    if (err.response?.status === 404) return true;
    if (err.response?.status === 401) return false;
    return false;
  }
};

const updatePlatformPaystackConfig = async ({ secretKey, webhookSecret, mode }) => {
  const existing = await loadPaystackConfig();
  const payload = {
    secretKey: secretKey || existing.secretKey,
    webhookSecret: webhookSecret || existing.webhookSecret,
    mode: mode || existing.mode,
  };

  await db.setting.upsert({
    key: "paystack_config",
    value: payload,
    updatedAt: new Date(),
  });

  cachedConfig = null;
  configLoadedAt = 0;
  return payload;
};

const verifyWebhookSignature = async (payload, signature) => {
  const config = await loadPaystackConfig();
  if (!config.webhookSecret) return false;
  const crypto = require("crypto");
  const hash = crypto.createHmac("sha512", config.webhookSecret).update(payload).digest("hex");
  return hash === signature;
};

const createCustomer = async (payload) => {
  return paystackRequest("post", "/customer", payload);
};

const createSubscription = async (payload) => {
  return paystackRequest("post", "/subscription", payload);
};

const createPlan = async ({ name, amount, interval = "monthly", currency = "GHS" }) => {
  return paystackRequest("post", "/plan", {
    name,
    amount: amount * 100,
    interval,
    currency,
  });
};

const PAYSTACK_CHANNEL_MAP = {
  mobile_money: "mobile_money",
  mtn_momo: "mtn_momo",
  vodafone_cash: "vodafone_cash",
  airtel_tigo: "airtel_tigo",
  card_paystack: "card",
  card: "card",
  bank_transfer: "bank_transfer",
};

const mapChannels = (channels) => {
  if (!Array.isArray(channels)) return null;
  return channels
    .map((ch) => PAYSTACK_CHANNEL_MAP[ch] || ch)
    .filter(Boolean);
};

const initializeCharge = async ({ email, amount, metadata = {}, splitConfig = null, channels = null }) => {
  const payload = {
    email,
    amount: amount * 100,
    metadata,
  };

  if (splitConfig) {
    payload.subaccount = splitConfig.subaccountCode;
    payload.transaction_charge = splitConfig.transactionCharge || 0;
    payload.bearer = splitConfig.bearer || "subaccount";
  }

  const mappedChannels = mapChannels(channels);
  if (mappedChannels && mappedChannels.length) {
    payload.channels = mappedChannels;
  }

  return paystackRequest("post", "/transaction/initialize", payload);
};

const verifyPayment = async (reference) => {
  return paystackRequest("get", `/transaction/verify/${reference}`);
};

const refundPayment = async (reference, amount = null) => {
  const payload = { transaction: reference };
  if (amount !== null) payload.amount = amount * 100;
  return paystackRequest("post", "/refund", payload);
};

const fetchCustomer = async (customerCode) => {
  return paystackRequest("get", `/customer/${customerCode}`);
};

const buildSplitConfig = (tenant) => {
  if (!tenant || !tenant.paystackSubaccountCode) return null;

  const settings = tenant.settings || {};
  const subaccount = tenant.paystackSubaccountCode;
  const bearer = settings.splitBearer || "subaccount";
  const charge = settings.splitCharge || 0;

  return {
    subaccountCode: subaccount,
    bearer,
    transactionCharge: charge,
  };
};

module.exports = {
  verifyWebhookSignature,
  createCustomer,
  createSubscription,
  createPlan,
  initializeCharge,
  verifyPayment,
  refundPayment,
  fetchCustomer,
  buildSplitConfig,
  buildPlatformClient,
  validateSecretKey,
  updatePlatformPaystackConfig,
};
