const db = require("../../db/models");
const baseDAO = require("./base.dao");

const announcementDAO = {};

announcementDAO.create = async (payload) => {
  return await db.announcement.create(payload);
};

announcementDAO.list = (filters = {}) => {
  const where = {};
  if (filters.channel) where.channel = filters.channel;
  if (filters.isActive !== undefined) where.isActive = filters.isActive;

  return db.announcement.findAll({
    where,
    order: [["createdAt", "DESC"]],
    limit: filters.limit || 100,
  });
};

announcementDAO.findById = (id) => {
  return db.announcement.findByPk(id);
};

announcementDAO.update = async (id, updates) => baseDAO.updateById(db.announcement, id, updates);

announcementDAO.remove = async (id) => baseDAO.removeById(db.announcement, id);

module.exports = announcementDAO;
