const db = require("../../db/models");

const supportTicketMessageDAO = {};

supportTicketMessageDAO.create = async (payload) => {
  return await db.supportTicketMessage.create(payload);
};

supportTicketMessageDAO.list = (filters = {}) => {
  const where = {};
  if (filters.ticketId) where.ticketId = filters.ticketId;

  return db.supportTicketMessage.findAll({
    where,
    order: [["createdAt", "ASC"]],
    limit: filters.limit || 1000,
  });
};

supportTicketMessageDAO.findById = (id, ticketId) => {
  const where = { id };
  if (ticketId) where.ticketId = ticketId;
  return db.supportTicketMessage.findOne({ where });
};

supportTicketMessageDAO.remove = async (id, ticketId) => {
  const message = await supportTicketMessageDAO.findById(id, ticketId);
  if (!message) return null;
  await message.destroy();
  return message;
};

module.exports = supportTicketMessageDAO;
