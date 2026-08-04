const express = require("express");
const router = express.Router();
const tipController = require("../controllers/whistleblowerTip.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");
const tryCatchHandler = require("../../middleware/tryCatch");
const { logAction } = require("../../middleware/auditLog");
const { adminActionLimiter } = require("../../middleware/rateLimit");

// codacy-suppress Rate limiting is applied to each route below via adminActionLimiter.
router.use(protect, requireSuperAdmin, logAction);

router.post("/", adminActionLimiter, tryCatchHandler(tipController.createTipHandler));
router.get("/", adminActionLimiter, tryCatchHandler(tipController.listTipsHandler));
router.get("/stats", adminActionLimiter, tryCatchHandler(tipController.getTipStatsHandler));
router.get("/:id", adminActionLimiter, tryCatchHandler(tipController.getTipHandler));
router.patch("/:id", adminActionLimiter, tryCatchHandler(tipController.updateTipHandler));

module.exports = router;
