const failedPaymentAlertDAO = require("../DAOs/failedPaymentAlert.dao");

const listFailedPaymentAlertsHandler = async (req, res) => {
  const { status, gateway, limit } = req.query;
  const tenantId = req.user?.isSuperAdmin ? null : req.tenant?.id;
  const data = await failedPaymentAlertDAO.list({
    tenantId,
    status,
    gateway,
    limit: limit ? parseInt(limit, 10) : 50,
  });
  res.status(200).json({ success: true, collection: data });
};

const getFailedPaymentAlertHandler = async (req, res) => {
  const alert = await failedPaymentAlertDAO.findById(req.params.id, req.user?.isSuperAdmin ? null : req.tenant?.id);
  if (!alert) {
    return res.status(404).json({ success: false, message: "Alert not found" });
  }
  res.status(200).json({ success: true, item: alert });
};

const retryFailedPaymentHandler = async (req, res) => {
  const alert = await failedPaymentAlertDAO.findById(req.params.id, req.user?.isSuperAdmin ? null : req.tenant?.id);
  if (!alert) {
    return res.status(404).json({ success: false, message: "Alert not found" });
  }

  if (alert.status === "resolved") {
    return res.status(400).json({ success: false, message: "Alert already resolved" });
  }

  const updated = await failedPaymentAlertDAO.incrementRetry(req.params.id, req.user?.isSuperAdmin ? null : req.tenant?.id);
  res.status(200).json({ success: true, item: updated });
};

const resolveFailedPaymentHandler = async (req, res) => {
  const alert = await failedPaymentAlertDAO.findById(req.params.id, req.user?.isSuperAdmin ? null : req.tenant?.id);
  if (!alert) {
    return res.status(404).json({ success: false, message: "Alert not found" });
  }

  const updated = await failedPaymentAlertDAO.resolve(req.params.id, req.user?.isSuperAdmin ? null : req.tenant?.id);
  res.status(200).json({ success: true, item: updated });
};

module.exports = {
  listFailedPaymentAlertsHandler,
  getFailedPaymentAlertHandler,
  retryFailedPaymentHandler,
  resolveFailedPaymentHandler,
};
