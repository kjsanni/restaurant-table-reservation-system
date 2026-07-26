const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const migrationController = require("../controllers/migration.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/status")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(migrationController.getMigrationStatusHandler))
  .all(httpMethodError);

module.exports = router;
