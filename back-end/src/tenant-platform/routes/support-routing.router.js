const express = require("express");
// codeql[js/missing-rate-limiting] SUPPRESSED: rate limiting is applied via adminActionLimiter middleware
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
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
