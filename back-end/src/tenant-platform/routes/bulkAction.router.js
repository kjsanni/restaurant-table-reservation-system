const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const bulkController = require("../controllers/bulkAction.controller");
const { protect, requirePermission } = require("../../middleware/auth");

router
  .route("/suspend")
  .post(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(bulkController.bulkSuspendHandler))
  .all(httpMethodError);

router
  .route("/change-plan")
  .post(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(bulkController.bulkChangePlanHandler))
  .all(httpMethodError);

router
  .route("/send-email")
  .post(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(bulkController.bulkSendEmailHandler))
  .all(httpMethodError);

module.exports = router;
