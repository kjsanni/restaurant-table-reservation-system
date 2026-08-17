const db = require("../../db/models");
const baseDAO = require("./base.dao");

const subProcessorDAO = {};

subProcessorDAO.create = async (payload) => {
  return await db.subProcessor.create(payload); // codacy-suppress nosql-injection - parameterized ORM call
};

subProcessorDAO.list = (filters = {}) => {
  const where = {};
  if (filters.category) where.category = filters.category;
  if (filters.isActive !== undefined) where.isActive = filters.isActive;

  return db.subProcessor.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where,
    order: [["name", "ASC"]],
    limit: filters.limit || 100,
  });
};

subProcessorDAO.findById = (id) => {
  return db.subProcessor.findByPk(id); // codacy-suppress nosql-injection - parameterized ORM call
};

subProcessorDAO.update = async (id, updates) => baseDAO.updateById(db.subProcessor, id, updates);

subProcessorDAO.remove = async (id) => baseDAO.removeById(db.subProcessor, id);

module.exports = subProcessorDAO;
