const db = require("../../db/models");

const noteDAO = {};

noteDAO.list = async (tenantId) => {
  return db.tenantNote.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where: { tenantId },
    order: [["createdAt", "DESC"]],
  });
};

noteDAO.create = async (tenantId, userId, note) => {
  return db.tenantNote.create({ tenantId, userId, note }); // codacy-suppress nosql-injection - parameterized ORM call
};

noteDAO.remove = async (id, tenantId) => {
// codacy-suppress NoSqlInjection
  const note = await db.tenantNote.findOne({ where: { id, tenantId } }); // codacy-suppress nosql-injection - parameterized ORM call
  if (!note) return null;
  await note.destroy();
  return note;
};

module.exports = noteDAO;
