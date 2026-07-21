const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const benchmarkController = require("../controllers/benchmark.controller");
const { protect, requirePermission } = require("../../middleware/auth");

router
  .route("/benchmarks")
  .get(
    tryCatchHandler(protect),
    tryCatchHandler(requirePermission("manage_tenants")),
    tryCatchHandler(benchmarkController.getBenchmarksHandler)
  )
  .all(httpMethodError);

module.exports = router;
