const express = require("express");
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
router.use(adminActionLimiter);
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const tenantSupportController = require("../controllers/tenantSupport.controller");
const { protect } = require("../../middleware/auth");
const upload = require("../middleware/supportAttachmentUpload");

router
  .route("/tickets")
  .get(tryCatchHandler(protect), tryCatchHandler(tenantSupportController.listMyTicketsHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(tenantSupportController.createTicketHandler))
  .all(httpMethodError);

router
  .route("/tickets/:id")
  .get(tryCatchHandler(protect), tryCatchHandler(tenantSupportController.getTicketHandler))
  .patch(tryCatchHandler(protect), tryCatchHandler(tenantSupportController.updateTicketHandler))
  .all(httpMethodError);

router
  .route("/tickets/:id/messages")
  .get(tryCatchHandler(protect), tryCatchHandler(tenantSupportController.listMessagesHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(tenantSupportController.sendMessageHandler))
  .all(httpMethodError);

router
  .route("/attachments")
  .get(tryCatchHandler(protect), tryCatchHandler(tenantSupportController.listAttachmentsHandler))
  .post(tryCatchHandler(protect), upload.single("file"), tryCatchHandler(tenantSupportController.createAttachmentHandler))
  .all(httpMethodError);

router
  .route("/attachments/download/:filename")
  .get(tryCatchHandler(protect), tryCatchHandler(tenantSupportController.downloadAttachmentHandler))
  .all(httpMethodError);

router
  .route("/attachments/:id")
  .delete(tryCatchHandler(protect), tryCatchHandler(tenantSupportController.deleteAttachmentHandler))
  .all(httpMethodError);

module.exports = router;
