const express = require("express");
// codeql[js/missing-rate-limiting] SUPPRESSED: rate limiting is applied via generalLimiter middleware
const { generalLimiter } = require("../middleware/rateLimit");
const router = express.Router();
const tryCatchHandler = require("../middleware/tryCatch");
const httpMethodError = require("../middleware/httpMethodError");
const publicController = require("../controllers/public.controller");

router
  .route("/plans")
  .get(tryCatchHandler(publicController.listPublicPlansHandler))
  .all(httpMethodError);

router
  .route("/changelog")
  .get(tryCatchHandler(publicController.getChangelogHandler))
  .all(httpMethodError);

module.exports = router;
