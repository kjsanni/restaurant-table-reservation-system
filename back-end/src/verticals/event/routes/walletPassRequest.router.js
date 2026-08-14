"use strict";

const express = require("express");
const router = express.Router({ mergeParams: true });
const tryCatchHandler = require("../../../middleware/tryCatch");
const httpMethodError = require("../../../middleware/httpMethodError");
const { protect, requirePermission } = require("../../../middleware/auth");
const { validateCsrfToken } = require("../../../middleware");
const { tenantLimiter, tenantWriteLimiter } = require("../../../tenant-platform/middleware/tenantRateLimit");
const walletPassRequestController = require("../controllers/walletPassRequest.controller");

// codeql[js/missing-rate-limiting] SUPPRESSED: tenantLimiter/tenantWriteLimiter applied below
router
  .route("/:eventId/wallet-passes/request")
  .post(tryCatchHandler(protect), tryCatchHandler(tenantWriteLimiter), tryCatchHandler(validateCsrfToken), tryCatchHandler(walletPassRequestController.createSigningRequest))
  .all(httpMethodError);

// codeql[js/missing-rate-limiting] SUPPRESSED: tenantLimiter applied below
router
  .route("/:eventId/wallet-passes/requests")
  .get(tryCatchHandler(protect), tryCatchHandler(tenantLimiter), tryCatchHandler(requirePermission("view_events")), tryCatchHandler(walletPassRequestController.listRequests))
  .all(httpMethodError);

// codeql[js/missing-rate-limiting] SUPPRESSED: tenantLimiter applied below
router
  .route("/:eventId/wallet-passes/requests/:requestId")
  .get(tryCatchHandler(protect), tryCatchHandler(tenantLimiter), tryCatchHandler(requirePermission("view_events")), tryCatchHandler(walletPassRequestController.getRequest))
  .all(httpMethodError);

module.exports = router;
