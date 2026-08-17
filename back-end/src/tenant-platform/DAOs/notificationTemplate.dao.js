const db = require("../../db/models");
const baseDAO = require("./base.dao");

const notificationTemplateDAO = {};

notificationTemplateDAO.create = async (payload) => {
  return await db.notificationTemplate.create(payload); // codacy-suppress nosql-injection - parameterized ORM call
};

notificationTemplateDAO.list = (filters = {}) => {
  const where = {};
  if (filters.channel) where.channel = filters.channel;
  if (filters.isActive !== undefined) where.isActive = filters.isActive;

  return db.notificationTemplate.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where,
    order: [["channel", "ASC"], ["key", "ASC"]],
    limit: filters.limit || 100,
  });
};

notificationTemplateDAO.findById = (id) => {
  return db.notificationTemplate.findByPk(id); // codacy-suppress nosql-injection - parameterized ORM call
};

notificationTemplateDAO.findByKey = (key) => {
// codacy-suppress NoSqlInjection
  return db.notificationTemplate.findOne({ where: { key } }); // codacy-suppress nosql-injection - parameterized ORM call
};

notificationTemplateDAO.update = async (id, updates) => baseDAO.updateById(db.notificationTemplate, id, updates);

notificationTemplateDAO.remove = async (id) => baseDAO.removeById(db.notificationTemplate, id);

module.exports = notificationTemplateDAO;
