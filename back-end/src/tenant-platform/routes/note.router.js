const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const noteController = require("../controllers/note.controller");
const { protect, requirePermission } = require("../../middleware/auth");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(noteController.listNotesHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(noteController.createNoteHandler))
  .all(httpMethodError);

router
  .route("/:noteId")
  .delete(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(noteController.deleteNoteHandler))
  .all(httpMethodError);

module.exports = router;
