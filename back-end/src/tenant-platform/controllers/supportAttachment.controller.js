const supportAttachmentDAO = require("../DAOs/supportAttachment.dao");
const platformAuditDAO = require("../DAOs/platformAudit.dao");

const listAttachmentsHandler = async (req, res) => {
  const { conversationId, ticketId, messageId } = req.query;
  const tenantId = req.user?.isSuperAdmin ? null : req.tenant?.id;
  const data = await supportAttachmentDAO.list({
    tenantId,
    conversationId: conversationId ? parseInt(conversationId, 10) : undefined,
    ticketId: ticketId ? parseInt(ticketId, 10) : undefined,
    messageId: messageId ? parseInt(messageId, 10) : undefined,
    limit: 100,
  });
  res.status(200).json({ success: true, collection: data });
};

const createAttachmentHandler = async (req, res) => {
  const { conversationId, ticketId, messageId, filename, originalName, mimeType, size, url } = req.body;
  if (!filename || !originalName) {
    return res.status(400).json({ success: false, message: "Filename and originalName are required" });
  }

  const attachment = await supportAttachmentDAO.create({
    tenantId: req.tenant?.id || null,
    conversationId: conversationId ? parseInt(conversationId, 10) : null,
    ticketId: ticketId ? parseInt(ticketId, 10) : null,
    messageId: messageId ? parseInt(messageId, 10) : null,
    userId: req.user.id,
    filename,
    originalName,
    mimeType: mimeType || null,
    size: size || null,
    url: url || null,
  });

  await platformAuditDAO.log(
    req.user.id,
    "support.attachment_uploaded",
    "support_attachment",
    attachment.id,
    req.tenant?.id || null,
    { conversationId, ticketId, filename },
    req.ip
  );

  res.status(201).json({ success: true, item: attachment });
};

const deleteAttachmentHandler = async (req, res) => {
  const attachment = await supportAttachmentDAO.remove(req.params.id, req.user?.isSuperAdmin ? null : req.tenant?.id);
  if (!attachment) {
    return res.status(404).json({ success: false, message: "Attachment not found" });
  }

  await platformAuditDAO.log(
    req.user.id,
    "support.attachment_deleted",
    "support_attachment",
    attachment.id,
    req.user?.isSuperAdmin ? null : req.tenant?.id,
    { filename: attachment.filename },
    req.ip
  );

  res.status(200).json({ success: true });
};

module.exports = {
  listAttachmentsHandler,
  createAttachmentHandler,
  deleteAttachmentHandler,
};
