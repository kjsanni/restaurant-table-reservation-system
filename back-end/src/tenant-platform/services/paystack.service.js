const axios = require("axios");

const PAYSTACK_BASE = process.env.PAYSTACK_MODE === "live"
  ? "https://api.paystack.co"
  : "https://api.paystack.co";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_WEBHOOK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET;

if (!PAYSTACK_SECRET_KEY) {
  console.warn("PAYSTACK_SECRET_KEY is not set. Billing features will fail.");
}

const paystackClient = axios.create({
  baseURL: PAYSTACK_BASE,
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});

const verifyWebhookSignature = (payload, signature) => {
  if (!PAYSTACK_WEBHOOK_SECRET) return true;
  const crypto = require("crypto");
  const hash = crypto.createHmac("sha512", PAYSTACK_WEBHOOK_SECRET).update(payload).digest("hex");
  return hash === signature;
};

const createCustomer = async ({ email, firstName, lastName, phone }) => {
  const response = await paystackClient.post("/customer", {
    email,
    first_name: firstName,
    last_name: lastName,
    phone,
  });
  return response.data.data;
};

const createSubscription = async ({ customerCode, planCode, authorization }) => {
  const response = await paystackClient.post("/subscription", {
    customer: customerCode,
    plan: planCode,
    authorization,
  });
  return response.data.data;
};

const createPlan = async ({ name, amount, interval = "monthly", currency = "GHS" }) => {
  const response = await paystackClient.post("/plan", {
    name,
    amount: amount * 100,
    interval,
    currency,
  });
  return response.data.data;
};

const initializeCharge = async ({ email, amount, metadata = {}, splitConfig = null }) => {
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

  const response = await paystackClient.post("/transaction/initialize", payload);
  return response.data.data;
};

const verifyPayment = async (reference) => {
  const response = await paystackClient.get(`/transaction/verify/${reference}`);
  return response.data.data;
};

const fetchCustomer = async (customerCode) => {
  const response = await paystackClient.get(`/customer/${customerCode}`);
  return response.data.data;
};

const buildSplitConfig = (tenant) => {
  if (!tenant || !tenant.paystackSubaccountCode) return null;

  const subaccount = tenant.paystackSubaccountCode;
  const bearer = tenant.settings?.splitBearer || "subaccount";
  const charge = tenant.settings?.splitCharge || 0;

  return {
    subaccountCode: subaccount,
    bearer,
    transactionCharge: charge,
  };
};

module.exports = {
  paystackClient,
  verifyWebhookSignature,
  createCustomer,
  createSubscription,
  createPlan,
  initializeCharge,
  verifyPayment,
  fetchCustomer,
  buildSplitConfig,
};
