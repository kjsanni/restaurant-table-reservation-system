const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const maintenanceController = require("../controllers/maintenance.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(maintenanceController.getMaintenanceModeHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(maintenanceController.setMaintenanceModeHandler))
  .all(httpMethodError);

module.exports = router;
