const express = require("express");
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
router.use(adminActionLimiter);
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const trustSafetyController = require("../controllers/trustSafety.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/health-scores")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(trustSafetyController.getTenantHealthScoresHandler))
  .all(httpMethodError);

module.exports = router;
