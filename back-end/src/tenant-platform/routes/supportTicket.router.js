const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const supportTicketController = require("../controllers/supportTicket.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(supportTicketController.listSupportTicketsHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(supportTicketController.createSupportTicketHandler))
  .all(httpMethodError);

router
  .route("/:id")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(supportTicketController.getSupportTicketHandler))
  .patch(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(supportTicketController.updateSupportTicketHandler))
  .all(httpMethodError);

module.exports = router;
