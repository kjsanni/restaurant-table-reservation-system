const dsarRequestDAO = require("../DAOs/dsarRequest.dao");

const DSAR_REQUEST_TYPES = [
  "access",
  "erasure",
  "rectification",
  "portability",
  "restriction",
  "objection",
];

const VALID_STATUSES = ["pending", "processing", "fulfilled", "rejected"];

const listHandler = async (req, res) => {
  const items = await dsarRequestDAO.listByTenant(req.params.tenantId);
  res.status(200).json({
    success: true,
    items: items.map((r) => ({
      id: r.id,
      requestType: r.requestType,
      status: r.status,
      requestData: r.requestData,
      staffNotes: r.staffNotes,
      fulfilledAt: r.fulfilledAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      requester: r.userId,
      ipAddress: r.ipAddress,
    })),
  });
};

const getHandler = async (req, res) => {
  const record = await dsarRequestDAO.findById(req.params.id, req.params.tenantId);
  if (!record) {
    return res.status(404).json({ success: false, message: "DSAR request not found" });
  }
  res.status(200).json({
    success: true,
    item: {
      id: record.id,
      requestType: record.requestType,
      status: record.status,
      requestData: record.requestData,
      staffNotes: record.staffNotes,
      fulfilledAt: record.fulfilledAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      requester: record.userId,
      ipAddress: record.ipAddress,
    },
  });
};

const createHandler = async (req, res) => {
  const { requestType, requestData, userId } = req.body;
  if (!requestType || !DSAR_REQUEST_TYPES.includes(requestType)) {
    return res.status(400).json({
      success: false,
      message: `Invalid requestType. Must be one of: ${DSAR_REQUEST_TYPES.join(", ")}`,
    });
  }

  const record = await dsarRequestDAO.create({
    tenantId: req.params.tenantId,
    userId: userId || req.user ? req.user.id : null,
    requestType,
    requestData: requestData || null,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"] || null,
  });

  res.status(201).json({
    success: true,
    item: {
      id: record.id,
      requestType: record.requestType,
      status: record.status,
      requestData: record.requestData,
      staffNotes: record.staffNotes,
      fulfilledAt: record.fulfilledAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    },
  });
};

const patchHandler = async (req, res) => {
  const { status, staffNotes } = req.body;

  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
    });
  }

  const record = await dsarRequestDAO.findById(req.params.id, req.params.tenantId);
  if (!record) {
    return res.status(404).json({ success: false, message: "DSAR request not found" });
  }

  const nextStatus = status || record.status;
  const nextNotes = staffNotes !== undefined ? staffNotes : record.staffNotes;
  const nextFulfilledAt = nextStatus === "fulfilled" && record.fulfilledAt === null
    ? new Date()
    : (nextStatus !== "fulfilled" ? null : record.fulfilledAt);

  await dsarRequestDAO.updateStatus(req.params.id, req.params.tenantId, nextStatus, nextNotes, nextFulfilledAt);

  const updated = await dsarRequestDAO.findById(req.params.id, req.params.tenantId);
  res.status(200).json({
    success: true,
    item: {
      id: updated.id,
      requestType: updated.requestType,
      status: updated.status,
      requestData: updated.requestData,
      staffNotes: updated.staffNotes,
      fulfilledAt: updated.fulfilledAt,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    },
  });
};

module.exports = {
  DSAR_REQUEST_TYPES,
  VALID_STATUSES,
  listHandler,
  getHandler,
  createHandler,
  patchHandler,
};
