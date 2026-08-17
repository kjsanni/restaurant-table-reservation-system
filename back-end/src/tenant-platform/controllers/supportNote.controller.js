const response = require("../utils/response");

const supportNoteDAO = require("../DAOs/supportNote.dao");
const platformAuditDAO = require("../DAOs/platformAudit.dao");
const auditLog = require("../utils/auditLog");

const listNotesHandler = async (req, res) => {
  const { conversationId, ticketId } = req.query;
  const tenantId = req.user?.isSuperAdmin ? null : req.tenant?.id;
  const data = await supportNoteDAO.list({
    tenantId,
    conversationId: conversationId ? parseInt(conversationId, 10) : undefined,
    ticketId: ticketId ? parseInt(ticketId, 10) : undefined,
    limit: 100,
  });
  res.status(200).json({ success: true, collection: data });
};

const createNoteHandler = async (req, res) => {
  const { conversationId, ticketId, body } = req.body;
  if (!body || !conversationId || !ticketId) {
    return response.badRequest(res, "Body, conversationId, and ticketId are required");
  }

  const mentions = (body.match(/@(\w+)/g) || []).map((m) => m.slice(1));

  const note = await supportNoteDAO.create({
    tenantId: req.tenant?.id || null,
    conversationId: parseInt(conversationId, 10),
    ticketId: parseInt(ticketId, 10),
    userId: req.user.id,
    body,
    mentions,
  });

await auditLog(req, "support.note_created", "support_note", note.id, { conversationId, ticketId, mentions });

  res.status(201).json({ success: true, item: note });
};

const deleteNoteHandler = async (req, res) => {
  const note = await supportNoteDAO.remove(req.params.id, req.user?.isSuperAdmin ? null : req.tenant?.id);
  if (!note) {
    return response.notFound(res, "Note not found");
  }

  await auditLog(req, "support.note_deleted", "support_note", note.id, {}, { tenantId: req.user?.isSuperAdmin ? null : req.tenant?.id });

  res.status(200).json({ success: true });
};

module.exports = {
  listNotesHandler,
  createNoteHandler,
  deleteNoteHandler,
};
