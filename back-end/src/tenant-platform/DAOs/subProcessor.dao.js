const db = require("../../db/models");

const subProcessorDAO = {};

subProcessorDAO.create = async (payload) => {
  return await db.subProcessor.create(payload);
};

subProcessorDAO.list = (filters = {}) => {
  const where = {};
  if (filters.category) where.category = filters.category;
  if (filters.isActive !== undefined) where.isActive = filters.isActive;

  return db.subProcessor.findAll({
    where,
    order: [["name", "ASC"]],
    limit: filters.limit || 100,
  });
};

subProcessorDAO.findById = (id) => {
  return db.subProcessor.findByPk(id);
};

subProcessorDAO.update = async (id, updates) => {
  const processor = await subProcessorDAO.findById(id);
  if (!processor) return null;
  await processor.update(updates);
  return processor;
};

subProcessorDAO.remove = async (id) => {
  const processor = await subProcessorDAO.findById(id);
  if (!processor) return null;
  await processor.destroy();
  return processor;
};

module.exports = subProcessorDAO;
