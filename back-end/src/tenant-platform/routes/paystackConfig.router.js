const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const paystackConfigController = require("../controllers/paystackConfig.controller");
const { protect, requirePlatformRole } = require("../../middleware/auth");

router
  .route("/config")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_billing")), tryCatchHandler(paystackConfigController.getConfigHandler))
  .all(httpMethodError);

router
  .route("/config/rotate")
  .post(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_billing")), tryCatchHandler(paystackConfigController.rotateKeyHandler))
  .all(httpMethodError);

module.exports = router;
