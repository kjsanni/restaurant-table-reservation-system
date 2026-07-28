const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const paystackConfigController = require("../controllers/paystackConfig.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/config")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(paystackConfigController.getConfigHandler))
  .all(httpMethodError);

router
  .route("/config/rotate")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(paystackConfigController.rotateKeyHandler))
  .all(httpMethodError);

module.exports = router;
