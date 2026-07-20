const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const revenueController = require("../controllers/revenue.controller");
const { protect, requirePermission } = require("../../middleware/auth");

router
  .route("/mrr-trends")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(revenueController.getMrrTrendsHandler))
  .all(httpMethodError);

router
  .route("/by-plan")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(revenueController.getRevenueByPlanHandler))
  .all(httpMethodError);

router
  .route("/ltv")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(revenueController.getLtvHandler))
  .all(httpMethodError);

module.exports = router;
