const reservationDAO = require("../DAOs/reservation.dao");
const { requireFeatureFlag } = require("../utils/featureFlags");

const buildCustomerDetails = (user) => {
  const email = user?.email;
  const phone = user?.phone || "";
  const nameParts = (user?.username || email || "Customer")
    .split(" ")
    .filter(Boolean);
  const firstName = nameParts.shift() || (email ? email.split("@")[0] : "Customer");
  const lastName = nameParts.join(" ") || "-";
  return { email, phone, firstName, lastName };
};

const getLoyaltyHandler = async (req, res) => {
  try {
    await requireFeatureFlag("loyalty", req.tenant?.id);
    const customer = await reservationDAO.findOrCreateCustomer(
      buildCustomerDetails(req.user),
      null,
      req.tenant?.id
    );
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer profile not found" });
    }
    const loyalty = await reservationDAO.getCustomerById(customer.id, req.tenant?.id);
    if (!loyalty) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
    return res.status(200).json({
      success: true,
      loyalty: {
        points: loyalty.points || 0,
        visitCount: loyalty.visitCount || 0,
        lastVisitDate: loyalty.lastVisitDate || null,
        tier: loyalty.points >= 500 ? "Gold" : loyalty.points >= 200 ? "Silver" : "Bronze",
      },
    });
  } catch (err) {
    console.error("getLoyaltyHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to load loyalty data" });
  }
};

const redeemPointsHandler = async (req, res) => {
  try {
    await requireFeatureFlag("loyalty", req.tenant?.id);
    const customer = await reservationDAO.findOrCreateCustomer(
      buildCustomerDetails(req.user),
      null,
      req.tenant?.id
    );
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer profile not found" });
    }

    const { points } = req.body;
    if (!points || Number(points) <= 0) {
      return res.status(400).json({ success: false, message: "Invalid points value." });
    }

    const redeemed = await reservationDAO.redeemCustomerPoints(customer.id, Number(points), req.tenant?.id);
    return res.status(200).json({ success: true, loyalty: redeemed });
  } catch (err) {
    console.error("redeemPointsHandler error:", err.message);
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message || "Failed to redeem points" });
  }
};

module.exports = {
  getLoyaltyHandler,
  redeemPointsHandler,
};
