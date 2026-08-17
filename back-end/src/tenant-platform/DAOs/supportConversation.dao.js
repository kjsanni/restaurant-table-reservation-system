const db = require("../../db/models");

const supportConversationDAO = {};

supportConversationDAO.create = async (payload) => {
  return await db.supportConversation.create(payload); // codacy-suppress nosql-injection - parameterized ORM call
};

supportConversationDAO.list = (filters = {}) => {
  const where = {};
  if (filters.tenantId) where.tenantId = filters.tenantId;
  if (filters.status) where.status = filters.status;
  if (filters.assignedTo) where.assignedTo = filters.assignedTo;

  return db.supportConversation.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where,
    order: [["createdAt", "DESC"]],
    limit: filters.limit || 100,
  });
};

supportConversationDAO.findById = (id, tenantId) => {
  const where = { id };
  if (tenantId) where.tenantId = tenantId;
// codacy-suppress NoSqlInjection
  return db.supportConversation.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
    where,
    include: [
      { model: db.supportMessage, as: "messages", order: [["createdAt", "ASC"]] },
    ],
  });
};

supportConversationDAO.update = async (id, updates, tenantId) => {
  const conversation = await supportConversationDAO.findById(id, tenantId);
  if (!conversation) return null;
  if (updates.status === "resolved" && !conversation.resolvedAt) {
    updates.resolvedAt = new Date();
  }
  await conversation.update(updates); // codacy-suppress nosql-injection - parameterized ORM call
  return conversation;
};

supportConversationDAO.remove = async (id, tenantId) => {
  const conversation = await supportConversationDAO.findById(id, tenantId);
  if (!conversation) return null;
  await conversation.destroy();
  return conversation;
};

module.exports = supportConversationDAO;
