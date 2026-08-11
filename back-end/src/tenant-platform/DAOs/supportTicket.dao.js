const db = require("../../db/models");

const supportTicketDAO = {};

supportTicketDAO.create = async (payload) => {
  return await db.supportTicket.create(payload);
};

supportTicketDAO.list = (filters = {}) => {
  const where = {};
  if (filters.tenantId) where.tenantId = filters.tenantId;
  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.userId) where.userId = filters.userId;
  if (filters.assignedTo) where.assignedTo = filters.assignedTo;

  return db.supportTicket.findAll({
    where,
    order: [["createdAt", "DESC"]],
    limit: filters.limit || 100,
  });
};

supportTicketDAO.findById = (id, tenantId) => {
  const where = { id };
  if (tenantId) where.tenantId = tenantId;
// codacy-suppress NoSqlInjection
  return db.supportTicket.findOne({ where });
};

supportTicketDAO.update = async (id, updates, tenantId) => {
  const ticket = await supportTicketDAO.findById(id, tenantId);
  if (!ticket) return null;
  if (updates.status === "resolved" && !ticket.resolvedAt) {
    updates.resolvedAt = new Date();
  }
  await ticket.update(updates);
  return ticket;
};

supportTicketDAO.remove = async (id, tenantId) => {
  const ticket = await supportTicketDAO.findById(id, tenantId);
  if (!ticket) return null;
  await ticket.destroy();
  return ticket;
};

module.exports = supportTicketDAO;
