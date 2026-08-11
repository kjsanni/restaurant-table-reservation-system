const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const supportTicketController = require("../controllers/supportTicket.controller");
const { protect, requireSuperAdmin, requirePlatformRole } = require("../../middleware/auth");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(supportTicketController.listSupportTicketsHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(supportTicketController.createSupportTicketHandler))
  .all(httpMethodError);

router
  .route("/:id")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(supportTicketController.getSupportTicketHandler))
  .patch(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(supportTicketController.updateSupportTicketHandler))
  .delete(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(supportTicketController.deleteSupportTicketHandler))
  .all(httpMethodError);

router
  .route("/:id/messages")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(supportTicketController.listTicketMessagesHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(supportTicketController.sendTicketMessageHandler))
  .all(httpMethodError);

router
  .route("/:id/auto-assign")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(supportTicketController.autoAssignTicketHandler))
  .all(httpMethodError);

module.exports = router;
