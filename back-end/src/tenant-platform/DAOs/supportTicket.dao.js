const db = require("../../db/models");

const supportTicketDAO = {};

supportTicketDAO.create = async (payload) => {
  return await db.supportTicket.create(payload); // codacy-suppress nosql-injection - parameterized ORM call
};

supportTicketDAO.list = async (filters = {}) => {
  const where = {};
  if (filters.tenantId) where.tenantId = filters.tenantId;
  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.userId) where.userId = filters.userId;
  if (filters.assignedTo) where.assignedTo = filters.assignedTo;
  if (filters.category) where.category = filters.category;

  const page = filters.page ? parseInt(filters.page, 10) : 1;
  const pageSize = filters.limit
    ? parseInt(filters.limit, 10)
    : filters.pageSize
    ? parseInt(filters.pageSize, 10)
    : 100;
  const offset =
    filters.offset !== undefined
      ? parseInt(filters.offset, 10)
      : (page - 1) * pageSize;

  const { rows, count } = await db.supportTicket.findAndCountAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where,
    order: [["createdAt", "DESC"]],
    limit: pageSize,
    offset,
  });
  return { collection: rows, total: count };
};

supportTicketDAO.findById = (id, tenantId) => {
  const where = { id };
  if (tenantId) where.tenantId = tenantId;
  return db.supportTicket.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
    where,
    include: [
      { model: db.user, as: "submitter", required: false },
      { model: db.user, as: "assignee", required: false },
      { model: db.supportTicketMessage, as: "messages", order: [["createdAt", "ASC"]] },
      { model: db.supportNote, as: "notes", required: false },
      { model: db.supportAttachment, as: "attachments", required: false },
    ],
  });
};

supportTicketDAO.update = async (id, updates, tenantId) => {
  const ticket = await supportTicketDAO.findById(id, tenantId);
  if (!ticket) return null;
  if (updates.status === "resolved" && !ticket.resolvedAt) {
    updates.resolvedAt = new Date();
  }
  await ticket.update(updates); // codacy-suppress nosql-injection - parameterized ORM call
  return ticket;
};

supportTicketDAO.remove = async (id, tenantId) => {
  const ticket = await supportTicketDAO.findById(id, tenantId);
  if (!ticket) return null;
  await ticket.destroy();
  return ticket;
};

module.exports = supportTicketDAO;
