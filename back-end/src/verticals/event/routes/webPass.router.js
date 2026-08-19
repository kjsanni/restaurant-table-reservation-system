// codeql[js/missing-rate-limiting] SUPPRESSED: rate limiting is applied via generalLimiter middleware in all routes
"use strict";

const express = require("express");
const router = express.Router({ mergeParams: true });
const tryCatchHandler = require("../../../middleware/tryCatch");
const { generalLimiter } = require("../../../middleware/rateLimit");
const { webPassController } = require("../controllers/webPass.controller");

router
  .route("/:shortCode")
  .get(generalLimiter, tryCatchHandler(webPassController.viewPass))
  .all((req, res) => res.status(405).json({ success: false, message: "Method not allowed" }));

module.exports = router;
