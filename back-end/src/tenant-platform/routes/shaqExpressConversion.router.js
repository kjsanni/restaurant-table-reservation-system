const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const shaqExpressConversionController = require("../controllers/shaqExpressConversion.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/shaqexpress/order-conversion")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(shaqExpressConversionController.getOrderConversionFunnelHandler))
  .all(httpMethodError);

module.exports = router;
