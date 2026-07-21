const db = require("../../db/models");

const dsarRequestDAO = {};

dsarRequestDAO.listByTenant = (tenantId) => {
  return db.dsarRequest.findAll({
    where: { tenantId },
    order: [["createdAt", "DESC"]],
  });
};

dsarRequestDAO.findById = (id, tenantId) => {
  return db.dsarRequest.findOne({
    where: { id, tenantId },
  });
};

dsarRequestDAO.create = ({ tenantId, userId, requestType, requestData, ipAddress, userAgent }) => {
  return db.dsarRequest.create({
    tenantId,
    userId: userId || null,
    requestType,
    status: "pending",
    requestData: requestData || null,
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
  });
};

dsarRequestDAO.updateStatus = (id, tenantId, status, staffNotes, fulfilledAt) => {
  return db.dsarRequest.update(
    { status, staffNotes: staffNotes || null, fulfilledAt: fulfilledAt || null },
    { where: { id, tenantId } }
  );
};

module.exports = dsarRequestDAO;
