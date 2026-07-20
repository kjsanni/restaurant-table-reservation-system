const noteDAO = require("../DAOs/note.dao");

const listNotesHandler = async (req, res) => {
  const tenantId = parseInt(req.params.tenantId, 10);
  if (!Number.isInteger(tenantId)) {
    return res.status(400).json({ success: false, message: "Invalid tenantId" });
  }
  const notes = await noteDAO.list(tenantId);
  res.status(200).json({ success: true, collection: notes });
};

const createNoteHandler = async (req, res) => {
  const { note } = req.body;
  if (!note || !note.trim()) {
    return res.status(400).json({ success: false, message: "Note text is required" });
  }
  const tenantId = parseInt(req.params.tenantId, 10);
  if (!Number.isInteger(tenantId)) {
    return res.status(400).json({ success: false, message: "Invalid tenantId" });
  }
  const userId = req.user?.id || null;
  const record = await noteDAO.create(tenantId, userId, note.trim());
  res.status(201).json({ success: true, item: record });
};

const deleteNoteHandler = async (req, res) => {
  const tenantId = parseInt(req.params.tenantId, 10);
  if (!Number.isInteger(tenantId)) {
    return res.status(400).json({ success: false, message: "Invalid tenantId" });
  }
  const note = await noteDAO.remove(req.params.noteId, tenantId);
  if (!note) {
    return res.status(404).json({ success: false, message: "Note not found" });
  }
  res.status(200).json({ success: true, message: "Note deleted" });
};

module.exports = {
  listNotesHandler,
  createNoteHandler,
  deleteNoteHandler,
};
