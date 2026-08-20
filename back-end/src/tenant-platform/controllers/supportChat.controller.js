const response = require("../utils/response");

const db = require("../../db/models");

const supportConversationDAO = require("../DAOs/supportConversation.dao");
const supportMessageDAO = require("../DAOs/supportMessage.dao");
const platformAuditDAO = require("../DAOs/platformAudit.dao");
const auditLog = require("../utils/auditLog");

const listConversationsHandler = async (req, res) => {
  const { status, assignedTo } = req.query;
  const tenantId = req.user?.isSuperAdmin ? null : req.tenant?.id;
  const data = await supportConversationDAO.list({
    tenantId,
    status,
    assignedTo,
    limit: 100,
  });
  res.status(200).json({ success: true, collection: data });
};

const getConversationHandler = async (req, res) => {
  const conversation = await supportConversationDAO.findById(req.params.id, req.user?.isSuperAdmin ? null : req.tenant?.id);
  if (!conversation) {
    return response.notFound(res, "Conversation not found");
  }
  res.status(200).json({ success: true, item: conversation });
};

const createConversationHandler = async (req, res) => {
  const { subject, message, priority } = req.body;
  if (!message) {
    return response.badRequest(res, "Message is required");
  }

  const conversation = await supportConversationDAO.create({
    tenantId: req.tenant?.id || null,
    userId: req.user?.id || null,
    subject: subject || null,
    priority: priority || "medium",
    status: "open",
    slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  await supportMessageDAO.create({
    conversationId: conversation.id,
    senderId: req.user?.id || null,
    senderType: "customer",
    body: message,
  });

await auditLog(req, "support.conversation_created", "support_conversation", conversation.id, { subject, priority });

  res.status(201).json({ success: true, item: conversation });
};

const updateConversationHandler = async (req, res) => {
  const allowed = ["status", "priority", "assignedTo"];
  const updates = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      updates[key] = req.body[key];
    }
  }

  const conversation = await supportConversationDAO.update(req.params.id, updates, req.user?.isSuperAdmin ? null : req.tenant?.id);
  if (!conversation) {
    return response.notFound(res, "Conversation not found");
  }

  await auditLog(req, "support.conversation_updated", "support_conversation", conversation.id, { updates });

  res.status(200).json({ success: true, item: conversation });
};

const deleteConversationHandler = async (req, res) => {
  const conversation = await supportConversationDAO.remove(req.params.id, req.user?.isSuperAdmin ? null : req.tenant?.id);
  if (!conversation) {
    return response.notFound(res, "Conversation not found");
  }

  await auditLog(req, "support.conversation_deleted", "support_conversation", conversation.id, {});

  res.status(200).json({ success: true });
};

const listMessagesHandler = async (req, res) => {
  const conversation = await supportConversationDAO.findById(req.params.id, req.user?.isSuperAdmin ? null : req.tenant?.id);
  if (!conversation) {
    return response.notFound(res, "Conversation not found");
  }

  const messages = await supportMessageDAO.list(conversation.id);
  res.status(200).json({ success: true, collection: messages });
};

const sendMessageHandler = async (req, res) => {
  const { body } = req.body;
  if (!body) {
    return response.badRequest(res, "Message body is required");
  }

  const conversation = await supportConversationDAO.findById(req.params.id, req.user?.isSuperAdmin ? null : req.tenant?.id);
  if (!conversation) {
    return response.notFound(res, "Conversation not found");
  }

  const message = await supportMessageDAO.create({
    conversationId: conversation.id,
    senderId: req.user?.id || null,
    senderType: req.user?.isSuperAdmin ? "agent" : "customer",
    body,
  });

  await supportConversationDAO.update(conversation.id, { lastMessageAt: new Date() }, req.user?.isSuperAdmin ? null : req.tenant?.id);

  await auditLog(req, "support.message_sent", "support_message", message.id, { conversationId: conversation.id }, { tenantId: req.user?.isSuperAdmin ? null : req.tenant?.id });

  res.status(201).json({ success: true, item: message });
};

const autoAssignConversationHandler = async (req, res) => {
  const conversation = await supportConversationDAO.findById(req.params.id, req.user?.isSuperAdmin ? null : req.tenant?.id);
  if (!conversation) {
    return response.notFound(res, "Conversation not found");
  }

  if (conversation.assignedTo) {
    return res.status(200).json({ success: true, item: conversation, message: "Already assigned" });
  }

  const agentWorkload = await db.supportConversation.findAll({
    where: {
      status: ["open", "in_progress"],
      assignedTo: { [db.Sequelize.Op.ne]: null },
    },
    attributes: [
      "assignedTo",
      [db.Sequelize.fn("COUNT", db.Sequelize.col("id")), "openCount"],
    ],
    group: ["assignedTo"],
    order: [[db.Sequelize.fn("COUNT", db.Sequelize.col("id")), "ASC"]],
    raw: true,
    limit: 1000,
  });

  let bestAgentId = null;
  if (agentWorkload.length > 0) {
    bestAgentId = agentWorkload[0].assignedTo;
  }

  if (bestAgentId) {
    await supportConversationDAO.update(req.params.id, { assignedTo: bestAgentId }, req.user?.isSuperAdmin ? null : req.tenant?.id);
    await auditLog(req, "support.conversation_auto_assigned", "support_conversation", conversation.id, { assignedTo: bestAgentId }, { tenantId: req.user?.isSuperAdmin ? null : req.tenant?.id });
    const updated = await supportConversationDAO.findById(req.params.id, req.user?.isSuperAdmin ? null : req.tenant?.id);
    return res.status(200).json({ success: true, item: updated });
  }

  return res.status(200).json({ success: true, item: conversation, message: "No agents available" });
};

const submitCsatHandler = async (req, res) => {
  const { rating, feedback } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return response.badRequest(res, "Rating must be between 1 and 5");
  }

  const conversation = await supportConversationDAO.findById(req.params.id, req.user?.isSuperAdmin ? null : req.tenant?.id);
  if (!conversation) {
    return response.notFound(res, "Conversation not found");
  }

  await supportConversationDAO.update(req.params.id, { csatRating: rating, csatFeedback: feedback || null }, req.user?.isSuperAdmin ? null : req.tenant?.id);

  await auditLog(req, "support.csat_submitted", "support_conversation", conversation.id, { rating }, { tenantId: req.user?.isSuperAdmin ? null : req.tenant?.id });

  const updated = await supportConversationDAO.findById(req.params.id, req.user?.isSuperAdmin ? null : req.tenant?.id);
  res.status(200).json({ success: true, item: updated });
};

module.exports = {
  listConversationsHandler,
  getConversationHandler,
  createConversationHandler,
  updateConversationHandler,
  deleteConversationHandler,
  listMessagesHandler,
  sendMessageHandler,
  autoAssignConversationHandler,
  submitCsatHandler,
};
