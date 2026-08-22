const response = require("../utils/response");

const failedPaymentAlertDAO = require("../DAOs/failedPaymentAlert.dao");

const listFailedPaymentAlertsHandler = async (req, res) => {
  const { status: queryStatus, gateway, limit } = req.query;
  const tenantId = req.user?.isSuperAdmin ? null : req.tenant?.id;
  const data = await failedPaymentAlertDAO.list({
    tenantId,
    queryStatus,
    gateway,
    limit: limit ? parseInt(limit, 10) : 50,
  });
  res.status(200).json({ success: true, collection: data });
};

const getFailedPaymentAlertHandler = async (req, res) => {
  const alert = await failedPaymentAlertDAO.findById(req.params.id, req.user?.isSuperAdmin ? null : req.tenant?.id);
  if (!alert) {
    return response.notFound(res, "Alert not found");
  }
  res.status(200).json({ success: true, item: alert });
};

const retryFailedPaymentHandler = async (req, res) => {
  const alert = await failedPaymentAlertDAO.findById(req.params.id, req.user?.isSuperAdmin ? null : req.tenant?.id);
  if (!alert) {
    return response.notFound(res, "Alert not found");
  }

  if (alert.status === "resolved") {
    return response.badRequest(res, "Alert already resolved");
  }

  const updated = await failedPaymentAlertDAO.incrementRetry(req.params.id, req.user?.isSuperAdmin ? null : req.tenant?.id);
  res.status(200).json({ success: true, item: updated });
};

const resolveFailedPaymentHandler = async (req, res) => {
  const alert = await failedPaymentAlertDAO.findById(req.params.id, req.user?.isSuperAdmin ? null : req.tenant?.id);
  if (!alert) {
    return response.notFound(res, "Alert not found");
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
