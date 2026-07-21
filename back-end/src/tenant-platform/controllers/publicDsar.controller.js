const db = require("../../db/models");
const dsarRequestDAO = require("../DAOs/dsarRequest.dao");
const { DSAR_REQUEST_TYPES } = require("./dsarRequest.controller");

const submitHandler = async (req, res) => {
  const { tenantSlug, requestType, requestData } = req.body;

  if (!tenantSlug) {
    return res.status(400).json({ success: false, message: "tenantSlug is required" });
  }
  if (!requestType || !DSAR_REQUEST_TYPES.includes(requestType)) {
    return res.status(400).json({
      success: false,
      message: `Invalid requestType. Must be one of: ${DSAR_REQUEST_TYPES.join(", ")}`,
    });
  }

  const tenant = await db.tenant.findOne({ where: { slug: tenantSlug } });
  if (!tenant) {
    return res.status(404).json({ success: false, message: "Tenant not found" });
  }

  const record = await dsarRequestDAO.create({
    tenantId: tenant.id,
    userId: null,
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
      createdAt: record.createdAt,
    },
  });
};

module.exports = { submitHandler };
