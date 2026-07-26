const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const suspiciousActivityController = require("../controllers/suspiciousActivity.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(suspiciousActivityController.getSuspiciousActivityHandler))
  .all(httpMethodError);

module.exports = router;
