const onboardingDAO = require("../DAOs/onboarding.dao");

const getOnboardingHandler = async (req, res) => {
  const record = await onboardingDAO.getByTenant(req.params.tenantId);
  if (!record) {
    return res.status(404).json({ success: false, message: "Onboarding not found" });
  }
  res.status(200).json({ success: true, item: record });
};

const updateOnboardingHandler = async (req, res) => {
  const { steps } = req.body;
  const record = await onboardingDAO.upsert(req.params.tenantId, steps || []);
  res.status(200).json({ success: true, item: record });
};

const completeOnboardingHandler = async (req, res) => {
  await onboardingDAO.complete(req.params.tenantId);
  res.status(200).json({ success: true, message: "Onboarding completed" });
};

module.exports = {
  getOnboardingHandler,
  updateOnboardingHandler,
  completeOnboardingHandler,
};
