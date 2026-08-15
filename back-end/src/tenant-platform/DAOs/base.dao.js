"use strict";

const baseDAO = {};

baseDAO.updateById = async (Model, id, updates) => {
  const record = await Model.findByPk(id);
  if (!record) return null;
  await record.update(updates);
  return record;
};

baseDAO.removeById = async (Model, id) => {
  const record = await Model.findByPk(id);
  if (!record) return null;
  await record.destroy();
  return record;
};

baseDAO.upsert = async (Model, where, data) => {
  const record = await Model.findOne({ where });
  if (record) {
    await record.update(data);
    return record;
  }
  return Model.create(data);
};

module.exports = baseDAO;
