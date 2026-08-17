"use strict";

const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../middleware/tryCatch");
const httpMethodError = require("../middleware/httpMethodError");
const { validateCsrfToken } = require("../middleware");
const { requireSuperAdmin } = require("../middleware/auth");
const walletPassRequestController = require("../verticals/event/controllers/walletPassRequest.controller");

router
  .route("/wallet-pass-requests")
  .get(tryCatchHandler(requireSuperAdmin), tryCatchHandler(walletPassRequestController.listPendingApproval))
  .all(httpMethodError);

router
  .route("/wallet-pass-requests/:requestId/approve")
  .post(tryCatchHandler(requireSuperAdmin), tryCatchHandler(validateCsrfToken), tryCatchHandler(walletPassRequestController.approveRequest))
  .all(httpMethodError);

router
  .route("/wallet-pass-requests/:requestId/reject")
  .post(tryCatchHandler(requireSuperAdmin), tryCatchHandler(validateCsrfToken), tryCatchHandler(walletPassRequestController.rejectRequest))
  .all(httpMethodError);

module.exports = router;
