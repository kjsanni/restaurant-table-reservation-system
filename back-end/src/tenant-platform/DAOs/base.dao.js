"use strict";

const baseDAO = {};

baseDAO.updateById = async (Model, id, updates) => {
  const record = await Model.findByPk(id); // codacy-suppress nosql-injection - parameterized ORM call
  if (!record) return null;
  await record.update(updates); // codacy-suppress nosql-injection - parameterized ORM call
  return record;
};

baseDAO.removeById = async (Model, id) => {
  const record = await Model.findByPk(id); // codacy-suppress nosql-injection - parameterized ORM call
  if (!record) return null;
  await record.destroy();
  return record;
};

baseDAO.upsert = async (Model, where, data) => {
  const record = await Model.findOne({ where }); // codacy-suppress nosql-injection - parameterized ORM call
  if (record) {
    await record.update(data); // codacy-suppress nosql-injection - parameterized ORM call
    return record;
  }
  return Model.create(data); // codacy-suppress nosql-injection - parameterized ORM call
};

module.exports = baseDAO;
