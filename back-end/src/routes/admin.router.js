const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../middleware/tryCatch");
const httpMethodError = require("../middleware/httpMethodError");
const adminController = require("../controllers/admin.controller");
const { protect, admin } = require("../middleware/auth");
const { adminActionLimiter } = require("../middleware/rateLimit");

router
  .route("/logs/email")
  .post(adminActionLimiter, tryCatchHandler(protect), tryCatchHandler(admin), tryCatchHandler(adminController.emailLogsHandler))
  .all(httpMethodError);

module.exports = router;
