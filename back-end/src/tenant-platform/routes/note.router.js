const express = require("express");
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
router.use(adminActionLimiter);
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const noteController = require("../controllers/note.controller");
const { protect, requirePermission } = require("../../middleware/auth");

router
  .route("/:tenantId/notes")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(noteController.listNotesHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(noteController.createNoteHandler))
  .all(httpMethodError);

router
  .route("/:tenantId/notes/:noteId")
  .delete(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(noteController.deleteNoteHandler))
  .all(httpMethodError);

module.exports = router;
