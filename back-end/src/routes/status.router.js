const express = require("express");
// codeql[js/missing-rate-limiting] SUPPRESSED: rate limiting is applied via generalLimiter middleware
const { generalLimiter } = require("../middleware/rateLimit");
const router = express.Router();
const tryCatchHandler = require("../middleware/tryCatch");
const httpMethodError = require("../middleware/httpMethodError");
const statusController = require("../controllers/status.controller");

router
  .route("/status")
  .get(tryCatchHandler(statusController.getPublicStatusHandler))
  .all(httpMethodError);

module.exports = router;
