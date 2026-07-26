const supportConversationDAO = require("../DAOs/supportConversation.dao");
const supportMessageDAO = require("../DAOs/supportMessage.dao");
const platformAuditDAO = require("../DAOs/platformAudit.dao");

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
    return res.status(404).json({ success: false, message: "Conversation not found" });
  }
  res.status(200).json({ success: true, item: conversation });
};

const createConversationHandler = async (req, res) => {
  const { subject, message, priority } = req.body;
  if (!message) {
    return res.status(400).json({ success: false, message: "Message is required" });
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

  await platformAuditDAO.log(
    req.user.id,
    "support.conversation_created",
    "support_conversation",
    conversation.id,
    req.tenant?.id || null,
    { subject, priority },
    req.ip
  );

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
    return res.status(404).json({ success: false, message: "Conversation not found" });
  }

  await platformAuditDAO.log(
    req.user.id,
    "support.conversation_updated",
    "support_conversation",
    conversation.id,
    req.tenant?.id || null,
    { updates },
    req.ip
  );

  res.status(200).json({ success: true, item: conversation });
};

const deleteConversationHandler = async (req, res) => {
  const conversation = await supportConversationDAO.remove(req.params.id, req.user?.isSuperAdmin ? null : req.tenant?.id);
  if (!conversation) {
    return res.status(404).json({ success: false, message: "Conversation not found" });
  }

  await platformAuditDAO.log(
    req.user.id,
    "support.conversation_deleted",
    "support_conversation",
    conversation.id,
    req.tenant?.id || null,
    {},
    req.ip
  );

  res.status(200).json({ success: true });
};

const listMessagesHandler = async (req, res) => {
  const conversation = await supportConversationDAO.findById(req.params.id, req.user?.isSuperAdmin ? null : req.tenant?.id);
  if (!conversation) {
    return res.status(404).json({ success: false, message: "Conversation not found" });
  }

  const messages = await supportMessageDAO.list(conversation.id);
  res.status(200).json({ success: true, collection: messages });
};

const sendMessageHandler = async (req, res) => {
  const { body } = req.body;
  if (!body) {
    return res.status(400).json({ success: false, message: "Message body is required" });
  }

  const conversation = await supportConversationDAO.findById(req.params.id, req.user?.isSuperAdmin ? null : req.tenant?.id);
  if (!conversation) {
    return res.status(404).json({ success: false, message: "Conversation not found" });
  }

  const message = await supportMessageDAO.create({
    conversationId: conversation.id,
    senderId: req.user?.id || null,
    senderType: req.user?.isSuperAdmin ? "agent" : "customer",
    body,
  });

  await supportConversationDAO.update(conversation.id, { lastMessageAt: new Date() }, req.user?.isSuperAdmin ? null : req.tenant?.id);

  await platformAuditDAO.log(
    req.user.id,
    "support.message_sent",
    "support_message",
    message.id,
    req.tenant?.id || null,
    { conversationId: conversation.id },
    req.ip
  );

  res.status(201).json({ success: true, item: message });
};

module.exports = {
  listConversationsHandler,
  getConversationHandler,
  createConversationHandler,
  updateConversationHandler,
  deleteConversationHandler,
  listMessagesHandler,
  sendMessageHandler,
};
