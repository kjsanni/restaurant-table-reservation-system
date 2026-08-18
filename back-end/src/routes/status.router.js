const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../middleware/tryCatch");
const httpMethodError = require("../middleware/httpMethodError");
const statusController = require("../controllers/status.controller");

router
  .route("/status")
  .get(tryCatchHandler(statusController.getPublicStatusHandler))
  .all(httpMethodError);

module.exports = router;
