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

router
  .route("/change-vertical")
  .post(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(bulkController.bulkChangeVerticalHandler))
  .all(httpMethodError);

router
  .route("/enable")
  .post(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(bulkController.bulkEnableHandler))
  .all(httpMethodError);

router
  .route("/export")
  .post(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(bulkController.bulkExportHandler))
  .all(httpMethodError);

router
  .route("/feature-flags")
  .post(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(bulkController.bulkAssignFeatureFlagsHandler))
  .all(httpMethodError);

router
  .route("/delete")
  .post(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(bulkController.bulkDeleteHandler))
  .all(httpMethodError);

module.exports = router;
