const breakGlassRequestDAO = require("../DAOs/breakGlassRequest.dao");
const platformAuditDAO = require("../DAOs/platformAudit.dao");

const MAX_DURATION_MINUTES = 240;

const logBreakGlassAudit = async (userId, event, requestId, tenantId, extra, ip) => {
  await platformAuditDAO
    .log(userId, event, "break_glass", requestId, tenantId, extra, ip)
    .catch((err) => {
      console.error(`${event} audit log failed:`, err.message);
    });
};

const validateBreakGlassRequest = (justification, durationMinutes) => {
  if (!justification || typeof justification !== "string" || justification.trim().length < 10) {
    return { error: { status: 400, message: "Justification must be at least 10 characters." } };
  }

  const duration = parseInt(durationMinutes, 10);
  if (!duration || duration < 1 || duration > MAX_DURATION_MINUTES) {
    return { error: { status: 400, message: `Duration must be between 1 and ${MAX_DURATION_MINUTES} minutes.` } };
  }

  return { duration };
};

const requestBreakGlassHandler = async (req, res) => {
  const validation = validateBreakGlassRequest(req.body.justification, req.body.durationMinutes);
  if (validation.error) {
    return res.status(validation.error.status).json({ success: false, message: validation.error.message });
  }

  const request = await breakGlassRequestDAO.create(req.user.id, req.body.justification.trim(), validation.duration);

  await logBreakGlassAudit(
    req.user.id,
    "break_glass.requested",
    request.id,
    req.tenant?.id || null,
    { durationMinutes: validation.duration, justification: req.body.justification.trim() },
    req.ip
  );

  return res.status(201).json({ success: true, request });
};

const approveBreakGlassHandler = async (req, res) => {
  const request = await breakGlassRequestDAO.approve(req.params.requestId, req.user.id, req.body.notes);
  if (!request) {
    return res.status(404).json({ success: false, message: "Break-glass request not found or not pending." });
  }

  await logBreakGlassAudit(
    req.user.id,
    "break_glass.approved",
    request.id,
    req.tenant?.id || null,
    { elevatedUntil: request.elevatedUntil, notes: req.body.notes },
    req.ip
  );

  return res.status(200).json({ success: true, request });
};

const denyBreakGlassHandler = async (req, res) => {
  const request = await breakGlassRequestDAO.deny(req.params.requestId, req.user.id, req.body.notes);
  if (!request) {
    return res.status(404).json({ success: false, message: "Break-glass request not found or not pending." });
  }

  await logBreakGlassAudit(
    req.user.id,
    "break_glass.denied",
    request.id,
    req.tenant?.id || null,
    { notes: req.body.notes },
    req.ip
  );

  return res.status(200).json({ success: true, request });
};

const revokeBreakGlassHandler = async (req, res) => {
  const request = await breakGlassRequestDAO.revoke(req.params.requestId, req.user.id);
  if (!request) {
    return res.status(404).json({ success: false, message: "Break-glass request not found or not active." });
  }

  await logBreakGlassAudit(
    req.user.id,
    "break_glass.revoked",
    request.id,
    req.tenant?.id || null,
    {},
    req.ip
  );

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
