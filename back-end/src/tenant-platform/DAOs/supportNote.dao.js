const db = require("../../db/models");

const supportNoteDAO = {};

supportNoteDAO.create = async (payload) => {
  return await db.supportNote.create(payload);
};

supportNoteDAO.list = (filters = {}) => {
  const where = {};
  if (filters.tenantId) where.tenantId = filters.tenantId;
  if (filters.conversationId) where.conversationId = filters.conversationId;
  if (filters.ticketId) where.ticketId = filters.ticketId;

  return db.supportNote.findAll({
    where,
    order: [["createdAt", "DESC"]],
    limit: filters.limit || 100,
    include: [
      { model: db.user, as: "author", attributes: ["id", "username", "email"] },
    ],
  });
};

supportNoteDAO.findById = (id, tenantId) => {
  const where = { id };
  if (tenantId) where.tenantId = tenantId;
// codacy-suppress NoSqlInjection
  return db.supportNote.findOne({
    where,
    include: [
      { model: db.user, as: "author", attributes: ["id", "username", "email"] },
    ],
  });
};

supportNoteDAO.remove = async (id, tenantId) => {
  const note = await supportNoteDAO.findById(id, tenantId);
  if (!note) return null;
  await note.destroy();
  return note;
};

module.exports = supportNoteDAO;
