const response = require("../utils/response");

const platformReferralDAO = require("../DAOs/platformReferral.dao");

const platformReferralController = {};

platformReferralController.listReferralsHandler = async (req, res) => {
  const data = await platformReferralDAO.listReferrals({});
  res.status(200).json({ success: true, collection: data });
};

platformReferralController.createReferralHandler = async (req, res) => {
  const allowed = ["referrerTenantId", "referredTenantId", "status", "rewardAmount"];
  const data = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      data[key] = req.body[key];
    }
  }
  const referral = await platformReferralDAO.createReferral(data);
  res.status(201).json({ success: true, item: referral });
};

platformReferralController.updateReferralHandler = async (req, res) => {
  const allowed = ["referrerTenantId", "referredTenantId", "status", "rewardAmount"];
  const updates = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      updates[key] = req.body[key];
    }
  }
  const referral = await platformReferralDAO.updateReferral(req.params.id, updates);
  if (!referral) return response.notFound(res, "Referral not found");
  res.status(200).json({ success: true, item: referral });
};

module.exports = platformReferralController;
