const express = require("express");
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
router.use(adminActionLimiter);
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const statusTimelineController = require("../controllers/statusTimeline.controller");
const { protect, requirePermission } = require("../../middleware/auth");

router
  .route("/:tenantId/timeline")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(statusTimelineController.getTimelineHandler))
  .all(httpMethodError);

module.exports = router;
