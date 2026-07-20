const db = require("../../db/models");

const noteDAO = {};

noteDAO.list = async (tenantId) => {
  return db.tenantNote.findAll({
    where: { tenantId },
    order: [["createdAt", "DESC"]],
  });
};

noteDAO.create = async (tenantId, userId, note) => {
  return db.tenantNote.create({ tenantId, userId, note });
};

noteDAO.remove = async (id, tenantId) => {
  const note = await db.tenantNote.findOne({ where: { id, tenantId } });
  if (!note) return null;
  await note.destroy();
  return note;
};

module.exports = noteDAO;
