const platformReferralDAO = require("../DAOs/platformReferral.dao");

const platformReferralController = {};

platformReferralController.listReferralsHandler = async (req, res) => {
  const data = await platformReferralDAO.listReferrals({});
  res.status(200).json({ success: true, collection: data });
};

platformReferralController.createReferralHandler = async (req, res) => {
  const referral = await platformReferralDAO.createReferral(req.body);
  res.status(201).json({ success: true, item: referral });
};

platformReferralController.updateReferralHandler = async (req, res) => {
  const referral = await platformReferralDAO.updateReferral(req.params.id, req.body);
  if (!referral) return res.status(404).json({ success: false, message: "Referral not found" });
  res.status(200).json({ success: true, item: referral });
};

module.exports = platformReferralController;
