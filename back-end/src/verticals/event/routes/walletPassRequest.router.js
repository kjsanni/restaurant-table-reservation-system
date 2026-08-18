"use strict";

const express = require("express");
const router = express.Router({ mergeParams: true });
const tryCatchHandler = require("../../../middleware/tryCatch");
const httpMethodError = require("../../../middleware/httpMethodError");
const { protect, requirePermission, requireSuperAdmin } = require("../../../middleware/auth");
const { validateCsrfToken } = require("../../../middleware");
const { tenantLimiter, tenantWriteLimiter } = require("../../../tenant-platform/middleware/tenantRateLimit");
const walletPassRequestController = require("../controllers/walletPassRequest.controller");

router
  .route("/:eventId/wallet-passes/request")
  .post(tenantWriteLimiter, tryCatchHandler(protect), tryCatchHandler(validateCsrfToken), tryCatchHandler(walletPassRequestController.createSigningRequest))
  .all(httpMethodError);

router
  .route("/:eventId/wallet-passes/requests")
  .get(tenantLimiter, tryCatchHandler(protect), tryCatchHandler(requirePermission("view_events")), tryCatchHandler(walletPassRequestController.listRequests))
  .all(httpMethodError);

router
  .route("/:eventId/wallet-passes/requests/:requestId")
  .get(tenantLimiter, tryCatchHandler(protect), tryCatchHandler(requirePermission("view_events")), tryCatchHandler(walletPassRequestController.getRequest))
  .all(httpMethodError);

// codeql[js/missing-rate-limiting] SUPPRESSED: tenantLimiter applied below
router
  .route("/:eventId/wallet-passes/requests/pending")
  .get(tryCatchHandler(protect), tryCatchHandler(tenantLimiter), tryCatchHandler(requireSuperAdmin), tryCatchHandler(walletPassRequestController.listPendingApproval))
  .all(httpMethodError);

// codeql[js/missing-rate-limiting] SUPPRESSED: tenantWriteLimiter applied below
router
  .route("/:eventId/wallet-passes/requests/:requestId/approve")
  .post(tryCatchHandler(protect), tryCatchHandler(tenantWriteLimiter), tryCatchHandler(validateCsrfToken), tryCatchHandler(requireSuperAdmin), tryCatchHandler(walletPassRequestController.approveRequest))
  .all(httpMethodError);

// codeql[js/missing-rate-limiting] SUPPRESSED: tenantWriteLimiter applied below
router
  .route("/:eventId/wallet-passes/requests/:requestId/reject")
  .post(tryCatchHandler(protect), tryCatchHandler(tenantWriteLimiter), tryCatchHandler(validateCsrfToken), tryCatchHandler(requireSuperAdmin), tryCatchHandler(walletPassRequestController.rejectRequest))
  .all(httpMethodError);

module.exports = router;
