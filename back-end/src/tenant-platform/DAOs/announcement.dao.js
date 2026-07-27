const db = require("../../db/models");

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

announcementDAO.update = async (id, updates) => {
  const announcement = await announcementDAO.findById(id);
  if (!announcement) return null;
  await announcement.update(updates);
  return announcement;
};

announcementDAO.remove = async (id) => {
  const announcement = await announcementDAO.findById(id);
  if (!announcement) return null;
  await announcement.destroy();
  return announcement;
};

module.exports = announcementDAO;
