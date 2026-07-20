const noteDAO = require("../DAOs/note.dao");

const listNotesHandler = async (req, res) => {
  const notes = await noteDAO.list(req.params.id);
  res.status(200).json({ success: true, collection: notes });
};

const createNoteHandler = async (req, res) => {
  const { note } = req.body;
  if (!note || !note.trim()) {
    return res.status(400).json({ success: false, message: "Note text is required" });
  }
  const userId = req.user?.id || null;
  const record = await noteDAO.create(req.params.id, userId, note.trim());
  res.status(201).json({ success: true, item: record });
};

const deleteNoteHandler = async (req, res) => {
  const note = await noteDAO.remove(req.params.noteId, req.params.id);
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
