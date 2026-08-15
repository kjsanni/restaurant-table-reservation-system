"use strict";

const express = require("express");
const router = express.Router({ mergeParams: true });
const tryCatchHandler = require("../../../middleware/tryCatch");
const httpMethodError = require("../../../middleware/httpMethodError");
const { protect, requirePermission } = require("../../../middleware/auth");
const { validateCsrfToken } = require("../../../middleware");
const { tenantLimiter, tenantWriteLimiter } = require("../../../tenant-platform/middleware/tenantRateLimit");
const walletPassRequestController = require("../controllers/walletPassRequest.controller");

router
  .route("/:eventId/wallet-passes/request")
  // codeql[js/missing-rate-limiting] SUPPRESSED: tenantWriteLimiter applied above
  .post(tryCatchHandler(protect), tryCatchHandler(tenantWriteLimiter), tryCatchHandler(validateCsrfToken), tryCatchHandler(walletPassRequestController.createSigningRequest))
  .all(httpMethodError);

router
  .route("/:eventId/wallet-passes/requests")
  // codeql[js/missing-rate-limiting] SUPPRESSED: tenantLimiter applied above
  .get(tryCatchHandler(protect), tryCatchHandler(tenantLimiter), tryCatchHandler(requirePermission("view_events")), tryCatchHandler(walletPassRequestController.listRequests))
  .all(httpMethodError);

router
  .route("/:eventId/wallet-passes/requests/:requestId")
  // codeql[js/missing-rate-limiting] SUPPRESSED: tenantLimiter applied above
  .get(tryCatchHandler(protect), tryCatchHandler(tenantLimiter), tryCatchHandler(requirePermission("view_events")), tryCatchHandler(walletPassRequestController.getRequest))
  .all(httpMethodError);

module.exports = router;
