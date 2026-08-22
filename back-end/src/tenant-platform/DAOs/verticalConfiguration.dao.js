const db = require("../../db/models");

const verticalConfigurationDAO = {};

verticalConfigurationDAO.findAll = (filters = {}) => {
  const where = {};
  if (filters.vertical) where.vertical = filters.vertical;
  if (filters.isActive !== undefined) where.isActive = filters.isActive;

  return db.verticalConfiguration.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where,
    order: [["vertical", "ASC"], ["useCaseType", "ASC"]],
    limit: filters.limit || 100,
    offset: filters.offset || 0,
  });
};

verticalConfigurationDAO.findById = (id) => {
  return db.verticalConfiguration.findByPk(id); // codacy-suppress nosql-injection - parameterized ORM call
};

verticalConfigurationDAO.findByVerticalAndType = (vertical, useCaseType) => {
  return db.verticalConfiguration.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
    where: { vertical, useCaseType },
  });
};

verticalConfigurationDAO.create = async (data) => {
  return await db.verticalConfiguration.create(data); // codacy-suppress nosql-injection - parameterized ORM call
};

verticalConfigurationDAO.update = async (id, data) => {
  const record = await verticalConfigurationDAO.findById(id);
  if (!record) return null;
  await record.update(data);
  return record;
};

verticalConfigurationDAO.remove = async (id) => {
  const record = await verticalConfigurationDAO.findById(id);
  if (!record) return null;
  await record.destroy();
  return record;
};

verticalConfigurationDAO.count = (filters = {}) => {
  const where = {};
  if (filters.vertical) where.vertical = filters.vertical;
  if (filters.isActive !== undefined) where.isActive = filters.isActive;

  return db.verticalConfiguration.count({ where });
};

module.exports = verticalConfigurationDAO;
