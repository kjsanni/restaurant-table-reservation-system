"use strict";

const express = require("express");
const router = express.Router({ mergeParams: true });
const tryCatchHandler = require("../../../middleware/tryCatch");
const httpMethodError = require("../../../middleware/httpMethodError");
const { validateCsrfToken } = require("../../../middleware");
const walletPassRequestController = require("../controllers/walletPassRequest.controller");

router
  .route("/:eventId/wallet-passes/request")
  .post(tryCatchHandler(validateCsrfToken), tryCatchHandler(walletPassRequestController.createSigningRequest))
  .all(httpMethodError);

router
  .route("/:eventId/wallet-passes/requests")
  .get(tryCatchHandler(walletPassRequestController.listRequests))
  .all(httpMethodError);

router
  .route("/:eventId/wallet-passes/requests/:requestId")
  .get(tryCatchHandler(walletPassRequestController.getRequest))
  .all(httpMethodError);

module.exports = router;
