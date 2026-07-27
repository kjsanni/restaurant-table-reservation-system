const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const { protect, requirePermission } = require("../../middleware/auth");
const paystackController = require("../controllers/paystack.controller");

router
  .route("/keys/rotate")
  .post(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_platform")), tryCatchHandler(paystackController.rotatePaystackKeysHandler))
  .all(httpMethodError);

router
  .route("/keys/status")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_platform")), tryCatchHandler(paystackController.getPaystackConfigStatusHandler))
  .all(httpMethodError);

module.exports = router;
