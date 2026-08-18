const express = require("express");
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
router.use(adminActionLimiter);
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const supportRoutingController = require("../controllers/support-routing.controller");
const { protect, requirePermission } = require("../../middleware/auth");

router
  .route("/tickets/:ticketId/route")
  .post(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_support")), tryCatchHandler(supportRoutingController.routeTicketHandler))
  .all(httpMethodError);

router
  .route("/queue/:teamId")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_support")), tryCatchHandler(supportRoutingController.getTicketQueueHandler))
  .all(httpMethodError);

module.exports = router;
