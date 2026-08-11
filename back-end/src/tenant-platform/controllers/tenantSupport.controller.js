const supportTicketDAO = require("../DAOs/supportTicket.dao");
const supportTicketMessageDAO = require("../DAOs/supportTicketMessage.dao");
const supportAttachmentDAO = require("../DAOs/supportAttachment.dao");
const platformAuditDAO = require("../DAOs/platformAudit.dao");
const supportNotificationService = require("../services/supportNotification.service");
const path = require("path");
const fs = require("fs");

const UPLOAD_DIR = path.join(__dirname, "../../../uploads/support-attachments");

const listMyTicketsHandler = async (req, res) => {
  const { status, category, limit } = req.query;
  const tenantId = req.tenant?.id;
  if (!tenantId) {
    return res.status(403).json({ success: false, message: "Tenant context required" });
  }

  const data = await supportTicketDAO.list({
    tenantId,
    status,
    category,
    limit: limit ? parseInt(limit, 10) : 50,
  });
  res.status(200).json({ success: true, collection: data });
};

const getTicketHandler = async (req, res) => {
  const ticket = await supportTicketDAO.findById(req.params.id, req.tenant?.id);
  if (!ticket) {
    return res.status(404).json({ success: false, message: "Ticket not found" });
  }
  res.status(200).json({ success: true, item: ticket });
};

const createTicketHandler = async (req, res) => {
  const { subject, message, priority, category } = req.body;
  if (!subject || !message) {
    return res.status(400).json({ success: false, message: "Subject and message are required" });
  }

  const ticket = await supportTicketDAO.create({
    tenantId: req.tenant?.id || null,
    userId: req.user?.id || null,
    subject,
    message,
    priority: priority || "medium",
    category: category || "general",
    status: "open",
    source: "web",
  });

  await supportTicketMessageDAO.create({
    ticketId: ticket.id,
    senderId: req.user?.id || null,
    senderType: "customer",
    body: message,
  });

  await platformAuditDAO.log(
    req.user.id,
    "support.tenant_ticket_created",
    "support_ticket",
    ticket.id,
    req.tenant?.id || null,
    { subject, priority, category },
    req.ip
  );

  const customerEmail = await supportNotificationService.resolveUserEmail(req.user.id);
  await supportNotificationService.notifyTicketCreated({
    ticket,
    tenantId: req.tenant?.id,
    recipientUserId: req.user.id,
    recipientEmail: customerEmail,
  });

  res.status(201).json({ success: true, item: ticket });
};

const updateTicketHandler = async (req, res) => {
  const allowed = ["status"];
  const updates = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      updates[key] = req.body[key];
    }
  }

  const ticket = await supportTicketDAO.update(req.params.id, updates, req.tenant?.id);
  if (!ticket) {
    return res.status(404).json({ success: false, message: "Ticket not found" });
  }

  await platformAuditDAO.log(
    req.user.id,
    "support.tenant_ticket_updated",
    "support_ticket",
    ticket.id,
    req.tenant?.id || null,
    { updates },
    req.ip
  );

  res.status(200).json({ success: true, item: ticket });
};

const listMessagesHandler = async (req, res) => {
  const ticket = await supportTicketDAO.findById(req.params.id, req.tenant?.id);
  if (!ticket) {
    return res.status(404).json({ success: false, message: "Ticket not found" });
  }

  const messages = await supportTicketMessageDAO.list({ ticketId: ticket.id });
  res.status(200).json({ success: true, collection: messages });
};

const sendMessageHandler = async (req, res) => {
  const { body } = req.body;
  if (!body) {
    return res.status(400).json({ success: false, message: "Message body is required" });
  }

  const ticket = await supportTicketDAO.findById(req.params.id, req.tenant?.id);
  if (!ticket) {
    return res.status(404).json({ success: false, message: "Ticket not found" });
  }

  if (ticket.status === "closed") {
    return res.status(400).json({ success: false, message: "Cannot reply to a closed ticket" });
  }

  const message = await supportTicketMessageDAO.create({
    ticketId: ticket.id,
    senderId: req.user?.id || null,
    senderType: "customer",
    body,
  });

  await supportTicketDAO.update(ticket.id, { status: "in_progress" }, req.tenant?.id);

  const customerEmail = await supportNotificationService.resolveUserEmail(ticket.userId);
  await supportNotificationService.notifyTicketReply({
    ticket,
    tenantId: req.tenant?.id,
    replySenderType: "agent",
    customerEmail,
    agentEmail: req.user.email,
  });

  await platformAuditDAO.log(
    req.user.id,
    "support.tenant_message_sent",
    "support_ticket_message",
    message.id,
    req.tenant?.id || null,
    { ticketId: ticket.id },
    req.ip
  );

  res.status(201).json({ success: true, item: message });
};

const listAttachmentsHandler = async (req, res) => {
  const { ticketId } = req.query;
  const tenantId = req.tenant?.id;
  if (!tenantId) {
    return res.status(403).json({ success: false, message: "Tenant context required" });
  }

  const data = await supportAttachmentDAO.list({
    tenantId,
    ticketId: ticketId ? parseInt(ticketId, 10) : undefined,
    limit: 100,
  });
  res.status(200).json({ success: true, collection: data });
};

const createAttachmentHandler = async (req, res) => {
  const file = req.file;
  const { ticketId } = req.body;
  if (!file) {
    return res.status(400).json({ success: false, message: "File is required" });
  }

  const relativePath = path.join("support-attachments", file.filename);
  const attachment = await supportAttachmentDAO.create({
    tenantId: req.tenant?.id || null,
    ticketId: ticketId ? parseInt(ticketId, 10) : null,
    userId: req.user.id,
    filename: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    url: `/api/v1/admin/support-tickets/tenant/attachments/download/${file.filename}`,
  });

  await platformAuditDAO.log(
    req.user.id,
    "support.tenant_attachment_uploaded",
    "support_attachment",
    attachment.id,
    req.tenant?.id || null,
    { ticketId, filename: file.filename },
    req.ip
  );

  res.status(201).json({ success: true, item: attachment });
};

const downloadAttachmentHandler = async (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(UPLOAD_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: "File not found" });
  }

  res.download(filePath, filename, (err) => {
    if (err) {
      console.error("Attachment download error:", err.message);
    }
  });
};

const deleteAttachmentHandler = async (req, res) => {
  const attachment = await supportAttachmentDAO.remove(req.params.id, req.tenant?.id);
  if (!attachment) {
    return res.status(404).json({ success: false, message: "Attachment not found" });
  }

  const filePath = path.join(UPLOAD_DIR, path.basename(attachment.filename || ""));
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  await platformAuditDAO.log(
    req.user.id,
    "support.tenant_attachment_deleted",
    "support_attachment",
    attachment.id,
    req.tenant?.id || null,
    { filename: attachment.filename },
    req.ip
  );

  res.status(200).json({ success: true });
};

module.exports = {
  listMyTicketsHandler,
  getTicketHandler,
  createTicketHandler,
  updateTicketHandler,
  listMessagesHandler,
  sendMessageHandler,
  listAttachmentsHandler,
  createAttachmentHandler,
  downloadAttachmentHandler,
  deleteAttachmentHandler,
};
