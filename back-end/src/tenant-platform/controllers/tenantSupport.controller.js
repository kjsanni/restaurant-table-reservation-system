const response = require("../utils/response");

const supportTicketDAO = require("../DAOs/supportTicket.dao");
const supportTicketMessageDAO = require("../DAOs/supportTicketMessage.dao");
const supportAttachmentDAO = require("../DAOs/supportAttachment.dao");
const platformAuditDAO = require("../DAOs/platformAudit.dao");
const supportNotificationService = require("../services/supportNotification.service");
const path = require("path");
const fs = require("fs");
const auditLog = require("../utils/auditLog");

const UPLOAD_DIR = path.join(__dirname, "../../../uploads/support-attachments");

const listMyTicketsHandler = async (req, res) => {
  const { status, category, limit } = req.query;
  const tenantId = req.tenant?.id;
  if (!tenantId) {
    return response.forbidden(res, "Tenant context required");
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
    return response.notFound(res, "Ticket not found");
  }
  res.status(200).json({ success: true, item: ticket });
};

const createTicketHandler = async (req, res) => {
  const { subject, message, priority, category } = req.body;
  if (!subject || !message) {
    return response.badRequest(res, "Subject and message are required");
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

await auditLog(req, "support.tenant_ticket_created", "support_ticket", ticket.id, { subject, priority, category });

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
    return response.notFound(res, "Ticket not found");
  }

  await auditLog(req, "support.tenant_ticket_updated", "support_ticket", ticket.id, { updates });

  res.status(200).json({ success: true, item: ticket });
};

const listMessagesHandler = async (req, res) => {
  const ticket = await supportTicketDAO.findById(req.params.id, req.tenant?.id);
  if (!ticket) {
    return response.notFound(res, "Ticket not found");
  }

  const messages = await supportTicketMessageDAO.list({ ticketId: ticket.id });
  res.status(200).json({ success: true, collection: messages });
};

const sendMessageHandler = async (req, res) => {
  const { body } = req.body;
  if (!body) {
    return response.badRequest(res, "Message body is required");
  }

  const ticket = await supportTicketDAO.findById(req.params.id, req.tenant?.id);
  if (!ticket) {
    return response.notFound(res, "Ticket not found");
  }

  if (ticket.status === "closed") {
    return response.badRequest(res, "Cannot reply to a closed ticket");
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

  await auditLog(req, "support.tenant_message_sent", "support_ticket_message", message.id, { ticketId: ticket.id });

  res.status(201).json({ success: true, item: message });
};

const listAttachmentsHandler = async (req, res) => {
  const { ticketId } = req.query;
  const tenantId = req.tenant?.id;
  if (!tenantId) {
    return response.forbidden(res, "Tenant context required");
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
    return response.badRequest(res, "File is required");
  }

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

await auditLog(req, "support.tenant_attachment_uploaded", "support_attachment", attachment.id, { ticketId, filename: file.filename });

  res.status(201).json({ success: true, item: attachment });
};

const downloadAttachmentHandler = async (req, res) => {
  const filename = path.basename(req.params.filename);
  if (!filename || filename === "." || filename === "..") {
    return response.badRequest(res, "Invalid file path");
  }

  const uploadDirResolved = path.resolve(UPLOAD_DIR);
  const filePath = path.join(uploadDirResolved, filename);

  if (!filePath.startsWith(uploadDirResolved + path.sep) && filePath !== uploadDirResolved) {
    return response.badRequest(res, "Invalid file path");
  }

  if (!fs.existsSync(filePath)) {
    return response.notFound(res, "File not found");
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
    return response.notFound(res, "Attachment not found");
  }

  const filename = path.basename(attachment.filename || "");
  const uploadDirResolved = path.resolve(UPLOAD_DIR);
  const filePath = path.join(uploadDirResolved, filename);

  if (filePath.startsWith(uploadDirResolved + path.sep) && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  await auditLog(req, "support.tenant_attachment_deleted", "support_attachment", attachment.id, { filename: attachment.filename });

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
