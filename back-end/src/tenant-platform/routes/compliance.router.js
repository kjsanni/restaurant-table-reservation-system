const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const complianceController = require("../controllers/compliance.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/scorecard")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(complianceController.getComplianceScorecardHandler))
  .all(httpMethodError);

module.exports = router;
