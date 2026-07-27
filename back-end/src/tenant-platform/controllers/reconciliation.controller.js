const reconciliationDAO = require("../DAOs/reconciliation.dao");

const reconciliationController = {};

reconciliationController.getMultiCurrencyTotalsHandler = async (req, res) => {
  const { from, to } = req.query;
  const data = await reconciliationDAO.getMultiCurrencyTotals({ from, to });
  res.status(200).json({ success: true, collection: data });
};

reconciliationController.getTenantCurrencyBreakdownHandler = async (req, res) => {
  const { from, to, plan, status } = req.query;
  const data = await reconciliationDAO.getTenantCurrencyBreakdown({ from, to, plan, status });
  res.status(200).json({ success: true, collection: data });
};

module.exports = reconciliationController;
