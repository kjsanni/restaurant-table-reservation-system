const express = require("express");
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
router.use(adminActionLimiter);
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const benchmarkController = require("../controllers/benchmark.controller");
const { protect, requirePermission } = require("../../middleware/auth");

router
  .route("/")
  .get(
    tryCatchHandler(protect),
    tryCatchHandler(requirePermission("manage_tenants")),
    tryCatchHandler(benchmarkController.getBenchmarksHandler)
  )
  .all(httpMethodError);

module.exports = router;
