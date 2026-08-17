const db = require("../../db/models");

const notificationDAO = {};

notificationDAO.list = (userId, tenantId) => {
  const where = {};
  if (userId) where.userId = userId;
  if (tenantId) where.tenantId = tenantId;
  return db.notification.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where,
    order: [["createdAt", "DESC"]],
    limit: 100,
  });
};

notificationDAO.create = (data) => db.notification.create(data); // codacy-suppress nosql-injection - parameterized ORM call

notificationDAO.markRead = (id, userId, tenantId) => {
  const where = { id, userId };
  if (tenantId) where.tenantId = tenantId;
  return db.notification.update({ readAt: new Date() }, { where }); // codacy-suppress nosql-injection - parameterized ORM call
};

module.exports = notificationDAO;
