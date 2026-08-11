const db = require("../../db/models");

const supportAttachmentDAO = {};

supportAttachmentDAO.create = async (payload) => {
  return await db.supportAttachment.create(payload);
};

supportAttachmentDAO.list = (filters = {}) => {
  const where = {};
  if (filters.tenantId) where.tenantId = filters.tenantId;
  if (filters.conversationId) where.conversationId = filters.conversationId;
  if (filters.ticketId) where.ticketId = filters.ticketId;
  if (filters.messageId) where.messageId = filters.messageId;
  if (filters.filename) where.filename = filters.filename;

  return db.supportAttachment.findAll({
    where,
    order: [["createdAt", "DESC"]],
    limit: filters.limit || 100,
  });
};

supportAttachmentDAO.remove = async (id, tenantId) => {
  const where = { id };
  if (tenantId) where.tenantId = tenantId;
  const attachment = await db.supportAttachment.findOne({ where });
  if (!attachment) return null;
  await attachment.destroy();
  return attachment;
};

module.exports = supportAttachmentDAO;
