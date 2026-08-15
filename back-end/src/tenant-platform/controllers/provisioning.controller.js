const response = require("../utils/response");

const provisioningService = require("../services/provisioning.service");
const { enqueueProvisioning } = require("../../queues/provisioning.queue");

const startProvisioningHandler = async (req, res) => {
  const { tenantId } = req.params;
  const initiatedBy = req.user?.id || null;
  const result = await enqueueProvisioning(tenantId, initiatedBy);
  if (!result.enqueued) {
    return res.status(503).json({ success: false, message: "Queue unavailable; provisioning could not be started" });
  }
  res.status(202).json({ success: true, jobId: result.jobId, message: "Provisioning queued" });
};

const pauseProvisioningHandler = async (req, res) => {
  const pipeline = await provisioningService.pauseProvisioning(req.params.tenantId, req.user?.id || null);
  res.status(200).json({ success: true, item: pipeline });
};

const resumeProvisioningHandler = async (req, res) => {
  const pipeline = await provisioningService.resumeProvisioning(req.params.tenantId, req.user?.id || null);
  res.status(200).json({ success: true, item: pipeline });
};

const rollbackProvisioningHandler = async (req, res) => {
  const pipeline = await provisioningService.rollbackProvisioning(req.params.tenantId, req.user?.id || null);
  res.status(200).json({ success: true, item: pipeline });
};

const getProvisioningStatusHandler = async (req, res) => {
  const status = provisioningService.getProvisioningStatus(req.params.tenantId);
  if (!status) {
    return response.notFound(res, "Provisioning not found for this tenant");
  }
  res.status(200).json({ success: true, item: status });
};

const listProvisioningStepsHandler = async (req, res) => {
  res.status(200).json({ success: true, items: provisioningService.STEPS });
};

const getDLQStatusHandler = async (req, res) => {
  const { tenantId } = req.params;
  const limit = parseInt(req.query.limit, 10) || 50;
  const dlqEntries = await provisioningService.getDLQStatus(tenantId, limit);
  res.status(200).json({ success: true, items: dlqEntries, count: dlqEntries.length });
};

const retryDLQEntryHandler = async (req, res) => {
  const { jobId } = req.params;
  const actorUserId = req.user?.id || null;
  try {
    const result = await provisioningService.retryDLQEntry(jobId, actorUserId);
    res.status(202).json({ success: true, message: "DLQ job re-enqueued", data: result });
  } catch (err) {
    if (err.status === 404) {
      return response.notFound(res, err.message);
    }
    throw err;
  }
};

module.exports = {
  startProvisioningHandler,
  pauseProvisioningHandler,
  resumeProvisioningHandler,
  rollbackProvisioningHandler,
  getProvisioningStatusHandler,
  listProvisioningStepsHandler,
  getDLQStatusHandler,
  retryDLQEntryHandler,
};
