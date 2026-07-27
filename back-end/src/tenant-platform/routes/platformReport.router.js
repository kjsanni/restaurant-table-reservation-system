const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const platformReportController = require("../controllers/platformReport.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(platformReportController.listPlatformReportsHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(platformReportController.createPlatformReportHandler))
  .all(httpMethodError);

router
  .route("/:id")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(platformReportController.getPlatformReportHandler))
  .delete(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(platformReportController.deletePlatformReportHandler))
  .all(httpMethodError);

router
  .route("/:id/download")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(platformReportController.downloadPlatformReportHandler))
  .all(httpMethodError);

module.exports = router;
