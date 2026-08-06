const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const shaqExpressConversionController = require("../controllers/shaqExpressConversion.controller");
const { protect, requirePlatformRole } = require("../../middleware/auth");

router
  .route("/order-conversion")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_admin")), tryCatchHandler(shaqExpressConversionController.getOrderConversionFunnelHandler))
  .all(httpMethodError);

module.exports = router;
