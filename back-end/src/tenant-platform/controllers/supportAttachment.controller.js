const response = require("../utils/response");

const supportAttachmentDAO = require("../DAOs/supportAttachment.dao");
const platformAuditDAO = require("../DAOs/platformAudit.dao");
const path = require("path");
const fs = require("fs");
const auditLog = require("../utils/auditLog");

const UPLOAD_DIR = path.join(__dirname, "../../../uploads/support-attachments");

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
  const file = req.file;
  const { conversationId, ticketId, messageId } = req.body;
  if (!file) {
    return response.badRequest(res, "File is required");
  }

  const attachment = await supportAttachmentDAO.create({
    tenantId: req.tenant?.id || null,
    conversationId: conversationId ? parseInt(conversationId, 10) : null,
    ticketId: ticketId ? parseInt(ticketId, 10) : null,
    messageId: messageId ? parseInt(messageId, 10) : null,
    userId: req.user.id,
    filename: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    url: `/api/v1/admin/support-attachments/download/${file.filename}`,
  });

await auditLog(req, "support.attachment_uploaded", "support_attachment", attachment.id, { conversationId, ticketId, filename: file.filename });

  res.status(201).json({ success: true, item: attachment });
};

const downloadAttachmentHandler = async (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(UPLOAD_DIR, filename); // codacy-suppress path-traversal
  const resolvedPath = path.resolve(filePath); // codacy-suppress path-traversal

  if (!resolvedPath.startsWith(path.resolve(UPLOAD_DIR))) {
    return response.badRequest(res, "Invalid file path");
  }

  if (!fs.existsSync(resolvedPath)) { // codacy-suppress path-traversal
    return response.notFound(res, "File not found");
  }

  res.download(resolvedPath, filename, (err) => { // codacy-suppress path-traversal
    if (err) {
      console.error("Attachment download error:", err.message);
    }
  });
};

const deleteAttachmentHandler = async (req, res) => {
  const attachment = await supportAttachmentDAO.remove(req.params.id, req.user?.isSuperAdmin ? null : req.tenant?.id);
  if (!attachment) {
    return response.notFound(res, "Attachment not found");
  }

  const filePath = path.join(UPLOAD_DIR, path.basename(attachment.filename || "")); // codacy-suppress path-traversal
  const resolvedPath = path.resolve(filePath); // codacy-suppress path-traversal
  if (resolvedPath.startsWith(path.resolve(UPLOAD_DIR)) && fs.existsSync(resolvedPath)) { // codacy-suppress path-traversal
    fs.unlinkSync(resolvedPath); // codacy-suppress path-traversal
  }

  await auditLog(req, "support.attachment_deleted", "support_attachment", attachment.id, { filename: attachment.filename }, { tenantId: req.user?.isSuperAdmin ? null : req.tenant?.id });

  res.status(200).json({ success: true });
};

module.exports = {
  listAttachmentsHandler,
  createAttachmentHandler,
  downloadAttachmentHandler,
  deleteAttachmentHandler,
};
