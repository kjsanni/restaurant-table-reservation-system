const db = require("../../db/models");

const notificationDAO = {};

notificationDAO.list = (userId, tenantId) => {
  const where = {};
  if (userId) where.userId = userId;
  if (tenantId) where.tenantId = tenantId;
  return db.notification.findAll({
    where,
    order: [["createdAt", "DESC"]],
    limit: 100,
  });
};

notificationDAO.create = (data) => db.notification.create(data);

notificationDAO.markRead = (id, userId) => {
  return db.notification.update({ readAt: new Date() }, { where: { id, userId } });
};

module.exports = notificationDAO;
