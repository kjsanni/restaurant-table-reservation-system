const db = require("../../db/models");

const dsarRequestDAO = {};

dsarRequestDAO.listByTenant = (tenantId) => {
  return db.dsarRequest.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where: { tenantId },
    order: [["createdAt", "DESC"]],
  });
};

dsarRequestDAO.findById = (id, tenantId) => {
// codacy-suppress NoSqlInjection
  return db.dsarRequest.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
    where: { id, tenantId },
  });
};

dsarRequestDAO.create = ({ tenantId, userId, requestType, requestData, ipAddress, userAgent }) => {
  return db.dsarRequest.create({ // codacy-suppress nosql-injection - parameterized ORM call
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
  return db.dsarRequest.update( // codacy-suppress nosql-injection - parameterized ORM call
    { status, staffNotes: staffNotes || null, fulfilledAt: fulfilledAt || null },
    { where: { id, tenantId } }
  );
};

module.exports = dsarRequestDAO;
