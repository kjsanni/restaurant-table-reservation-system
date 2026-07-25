const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const securityController = require("../controllers/security.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/brute-force-aggregation")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(securityController.getBruteForceAggregationHandler))
  .all(httpMethodError);

module.exports = router;
