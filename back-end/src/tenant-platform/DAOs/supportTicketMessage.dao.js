const db = require("../../db/models");

const supportTicketMessageDAO = {};

supportTicketMessageDAO.create = async (payload) => {
  return await db.supportTicketMessage.create(payload); // codacy-suppress nosql-injection - parameterized ORM call
};

supportTicketMessageDAO.list = (filters = {}) => {
  const where = {};
  if (filters.ticketId) where.ticketId = filters.ticketId;

  return db.supportTicketMessage.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where,
    order: [["createdAt", "ASC"]],
    limit: filters.limit || 100,
  });
};

supportTicketMessageDAO.findById = (id, ticketId) => {
  const where = { id };
  if (ticketId) where.ticketId = ticketId;
  return db.supportTicketMessage.findOne({ where }); // codacy-suppress nosql-injection - parameterized ORM call
};

supportTicketMessageDAO.remove = async (id, ticketId) => {
  const message = await supportTicketMessageDAO.findById(id, ticketId);
  if (!message) return null;
  await message.destroy();
  return message;
};

module.exports = supportTicketMessageDAO;
