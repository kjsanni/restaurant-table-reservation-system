const db = require("../../db/models");

const notificationTemplateDAO = {};

notificationTemplateDAO.create = async (payload) => {
  return await db.notificationTemplate.create(payload);
};

notificationTemplateDAO.list = (filters = {}) => {
  const where = {};
  if (filters.channel) where.channel = filters.channel;
  if (filters.isActive !== undefined) where.isActive = filters.isActive;

  return db.notificationTemplate.findAll({
    where,
    order: [["channel", "ASC"], ["key", "ASC"]],
    limit: filters.limit || 100,
  });
};

notificationTemplateDAO.findById = (id) => {
  return db.notificationTemplate.findByPk(id);
};

notificationTemplateDAO.findByKey = (key) => {
// codacy-suppress NoSqlInjection
  return db.notificationTemplate.findOne({ where: { key } });
};

notificationTemplateDAO.update = async (id, updates) => {
  const template = await notificationTemplateDAO.findById(id);
  if (!template) return null;
  await template.update(updates);
  return template;
};

notificationTemplateDAO.remove = async (id) => {
  const template = await notificationTemplateDAO.findById(id);
  if (!template) return null;
  await template.destroy();
  return template;
};

module.exports = notificationTemplateDAO;
