const customerService = require("../services/customerService");
const reservationDAO = require("../DAOs/reservation.dao");
const { sendWhatsAppText } = require("../services/whatsapp.service");
const { setOtp, getOtp, clearOtp } = require("../utils/otpStore");

const getCustomerHandler = async (req, res) => {
  const { customerId } = req.params;
  const customer = await customerService.getCustomerLoyalty(customerId, req.tenant?.id);
  if (!customer) {
    return res.status(404).json({ success: false, message: "Customer not found" });
  }
  return res.status(200).json({ success: true, customer });
};

const getCustomerProfileHandler = async (req, res) => {
  const { customerId } = req.params;

  const customer = await reservationDAO.getCustomerById(customerId, req.tenant?.id);
  if (!customer) {
    return res.status(404).json({ success: false, message: "Customer not found" });
  }

  const [history, stats] = await Promise.all([
    reservationDAO.getCustomerReservationHistory(customerId, 50, req.tenant?.id),
    reservationDAO.getCustomerStats(customerId, req.tenant?.id),
  ]);

  return res.status(200).json({
    success: true,
    profile: {
      customer,
      history,
      stats,
    },
  });
};

const updateTagsHandler = async (req, res) => {
  const { customerId } = req.params;
  const { tags } = req.body;
  const customer = await customerService.updateCustomerTags(customerId, tags, req.tenant?.id);
  return res.status(200).json({ success: true, customer });
};

const updateCustomerHandler = async (req, res) => {
  const { customerId } = req.params;
  const updates = req.body;
  const customer = await customerService.updateCustomer(customerId, updates, req.tenant?.id);
  return res.status(200).json({ success: true, customer });
};

const { requireFeatureFlag } = require("../utils/featureFlags");

const findOrCreateHandler = async (req, res) => {
  const customer = await customerService.findOrCreateCustomer(req.body, req.tenant?.id);
  return res.status(200).json({ success: true, customer });
};

const incrementVisitHandler = async (req, res) => {
  const { customerId } = req.params;
  const customer = await customerService.incrementVisit(customerId, req.tenant?.id);
  if (!customer) {
    return res.status(404).json({ success: false, message: "Customer not found" });
  }
  return res.status(200).json({ success: true, customer });
};

const addPointsHandler = async (req, res) => {
  await requireFeatureFlag("loyalty", req.tenant?.id);
  const { customerId } = req.params;
  const { points } = req.body;
  if (!points || Number(points) <= 0) {
    return res.status(400).json({ success: false, message: "Invalid points value." });
  }
  const customer = await customerService.addPoints(customerId, Number(points), req.tenant?.id);
  if (!customer) {
    return res.status(404).json({ success: false, message: "Customer not found" });
  }
  return res.status(200).json({ success: true, customer });
};

const redeemPointsHandler = async (req, res) => {
  await requireFeatureFlag("loyalty", req.tenant?.id);
  const { customerId } = req.params;
  const { points } = req.body;
  if (!points || Number(points) <= 0) {
    return res.status(400).json({ success: false, message: "Invalid points value." });
  }
  const customer = await customerService.redeemPoints(customerId, Number(points), req.tenant?.id);
  if (!customer) {
    return res.status(404).json({ success: false, message: "Customer not found" });
  }
  return res.status(200).json({ success: true, customer });
};

const updatePreferencesHandler = async (req, res) => {
  const { customerId } = req.params;
  const preferences = req.body.preferences || {};
  const customer = await customerService.updatePreferences(customerId, preferences, req.tenant?.id);
  if (!customer) {
    return res.status(404).json({ success: false, message: "Customer not found" });
  }
  return res.status(200).json({ success: true, customer });
};

const searchCustomersHandler = async (req, res) => {
  const query = (req.query.q || "").trim();
  if (!query) {
    return res.status(400).json({ success: false, message: "Query is required" });
  }
  const customers = await customerService.searchCustomers(query, req.tenant?.id);
  return res.status(200).json({ success: true, customers });
};

const checkWhatsAppHandler = async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ success: false, message: "Phone is required" });
  }

  const normalized = phone.replace(/\D/g, "");
  const customers = await customerService.searchCustomers(normalized, req.tenant?.id);
  const match = customers.find((c) => (c.phone || "").replace(/\D/g, "").includes(normalized) || normalized.includes((c.phone || "").replace(/\D/g, "")));

  return res.status(200).json({
    success: true,
    exists: Boolean(match),
    customerId: match?.id || null,
  });
};

const sendOtpHandler = async (req, res) => {
  const { phone, firstName, lastName, email } = req.body;
  if (!phone) {
    return res.status(400).json({ success: false, message: "Phone is required" });
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  let customerId = null;

  if (firstName || email) {
    const customer = await customerService.findOrCreateCustomer(
      { firstName: firstName || "", lastName: lastName || "", phone, email: email || undefined },
      req.tenant?.id
    );
    customerId = customer.id;
  } else {
    const normalized = phone.replace(/\D/g, "");
    const customers = await customerService.searchCustomers(normalized, req.tenant?.id);
    const match = customers.find((c) => (c.phone || "").replace(/\D/g, "").includes(normalized) || normalized.includes((c.phone || "").replace(/\D/g, "")));
    if (match) customerId = match.id;
  }

  setOtp(phone, code, customerId);

  try {
    await sendWhatsAppText(phone, `Your verification code is ${code}. It expires in 5 minutes.`, req.tenant?.id);
  } catch (err) {
    console.error("WhatsApp OTP send failed:", err.message);
  }

  return res.status(200).json({ success: true, message: "OTP sent" });
};

const verifyOtpHandler = async (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ success: false, message: "Phone and code are required" });
  }

  const entry = getOtp(phone);
  if (!entry) {
    return res.status(400).json({ success: false, message: "OTP expired or not found" });
  }

  if (entry.code !== String(code)) {
    return res.status(400).json({ success: false, message: "Invalid code" });
  }

  clearOtp(phone);

  let token = null;
  let user = null;

  if (entry.customerId) {
    const customer = await reservationDAO.getCustomerById(entry.customerId, req.tenant?.id);
    if (customer?.email) {
      const authService = require("../services/authService");
      try {
        const loginResult = await authService.loginUser(require("../DAOs/auth.dao"), { email: customer.email, password: "" }, req.tenant?.id, require("../DAOs/auth.dao"), req.ip || req.connection?.remoteAddress);
        token = loginResult.token;
        user = loginResult.user;

        const isSecure = req.secure || false;
        const cookieBase = {
          httpOnly: true,
          secure: isSecure,
          sameSite: isSecure ? "lax" : false,
          path: "/",
        };

        res.cookie("token", loginResult.token, { ...cookieBase, maxAge: 30 * 60 * 1000 });
        if (loginResult.refreshToken) {
          res.cookie("refreshToken", loginResult.refreshToken, { ...cookieBase, maxAge: 30 * 24 * 60 * 60 * 1000 });
        }
      } catch {
        token = null;
        user = null;
      }
    }
  }

  return res.status(200).json({
    success: true,
    customerId: entry.customerId,
    token,
    user,
  });
};

module.exports = {
  getCustomerHandler,
  getCustomerProfileHandler,
  updateTagsHandler,
  findOrCreateHandler,
  incrementVisitHandler,
  addPointsHandler,
  redeemPointsHandler,
  updatePreferencesHandler,
  searchCustomersHandler,
  checkWhatsAppHandler,
  sendOtpHandler,
  verifyOtpHandler,
};
