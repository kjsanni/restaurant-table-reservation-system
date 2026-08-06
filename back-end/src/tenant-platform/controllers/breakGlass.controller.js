const breakGlassRequestDAO = require("../DAOs/breakGlassRequest.dao");
const platformAuditDAO = require("../DAOs/platformAudit.dao");

const MAX_DURATION_MINUTES = 240;

const requestBreakGlassHandler = async (req, res) => {
  const { justification, durationMinutes } = req.body;

  if (!justification || typeof justification !== "string" || justification.trim().length < 10) {
    return res.status(400).json({
      success: false,
      message: "Justification must be at least 10 characters.",
    });
  }

  const duration = parseInt(durationMinutes, 10);
  if (!duration || duration < 1 || duration > MAX_DURATION_MINUTES) {
    return res.status(400).json({
      success: false,
      message: `Duration must be between 1 and ${MAX_DURATION_MINUTES} minutes.`,
    });
  }

  const request = await breakGlassRequestDAO.create(req.user.id, justification.trim(), duration);

  await platformAuditDAO
    .log(
      req.user.id,
      "break_glass.requested",
      "break_glass",
      request.id,
      req.tenant?.id || null,
      { durationMinutes: duration, justification: justification.trim() },
      req.ip
    )
    .catch((err) => {
      console.error("break_glass.requested audit log failed:", err.message);
    });

  return res.status(201).json({ success: true, request });
};

const approveBreakGlassHandler = async (req, res) => {
  const { requestId } = req.params;
  const { notes } = req.body;

  const request = await breakGlassRequestDAO.approve(requestId, req.user.id, notes);
  if (!request) {
    return res.status(404).json({ success: false, message: "Break-glass request not found or not pending." });
  }

  await platformAuditDAO
    .log(
      req.user.id,
      "break_glass.approved",
      "break_glass",
      request.id,
      req.tenant?.id || null,
      { elevatedUntil: request.elevatedUntil, notes },
      req.ip
    )
    .catch((err) => {
      console.error("break_glass.approved audit log failed:", err.message);
    });

  return res.status(200).json({ success: true, request });
};

const denyBreakGlassHandler = async (req, res) => {
  const { requestId } = req.params;
  const { notes } = req.body;

  const request = await breakGlassRequestDAO.deny(requestId, req.user.id, notes);
  if (!request) {
    return res.status(404).json({ success: false, message: "Break-glass request not found or not pending." });
  }

  await platformAuditDAO
    .log(
      req.user.id,
      "break_glass.denied",
      "break_glass",
      request.id,
      req.tenant?.id || null,
      { notes },
      req.ip
    )
    .catch((err) => {
      console.error("break_glass.denied audit log failed:", err.message);
    });

  return res.status(200).json({ success: true, request });
};

const revokeBreakGlassHandler = async (req, res) => {
  const { requestId } = req.params;

  const request = await breakGlassRequestDAO.revoke(requestId, req.user.id);
  if (!request) {
    return res.status(404).json({ success: false, message: "Break-glass request not found or not active." });
  }

  await platformAuditDAO
    .log(
      req.user.id,
      "break_glass.revoked",
      "break_glass",
      request.id,
      req.tenant?.id || null,
      {},
      req.ip
    )
    .catch((err) => {
      console.error("break_glass.revoked audit log failed:", err.message);
    });

  return res.status(200).json({ success: true, request });
};

const listBreakGlassRequestsHandler = async (req, res) => {
  const { status } = req.query;
  const requests = await breakGlassRequestDAO.listPending({ status, limit: 100 });
  return res.status(200).json({ success: true, collection: requests });
};

const listMyBreakGlassRequestsHandler = async (req, res) => {
  const { status } = req.query;
  const requests = await breakGlassRequestDAO.listForUser(req.user.id, { status, limit: 100 });
  return res.status(200).json({ success: true, collection: requests });
};

const expireBreakGlassHandler = async (req, res) => {
  const expired = await breakGlassRequestDAO.expireOld();
  return res.status(200).json({ success: true, expiredCount: expired.length });
};

module.exports = {
  requestBreakGlassHandler,
  approveBreakGlassHandler,
  denyBreakGlassHandler,
  revokeBreakGlassHandler,
  listBreakGlassRequestsHandler,
  listMyBreakGlassRequestsHandler,
  expireBreakGlassHandler,
  MAX_DURATION_MINUTES,
};
