const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const supportAttachmentController = require("../controllers/supportAttachment.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");
const upload = require("../middleware/supportAttachmentUpload");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(supportAttachmentController.listAttachmentsHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), upload.single("file"), tryCatchHandler(supportAttachmentController.createAttachmentHandler))
  .all(httpMethodError);

router
  .route("/download/:filename")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(supportAttachmentController.downloadAttachmentHandler))
  .all(httpMethodError);

router
  .route("/:id")
  .delete(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(supportAttachmentController.deleteAttachmentHandler))
  .all(httpMethodError);

module.exports = router;
