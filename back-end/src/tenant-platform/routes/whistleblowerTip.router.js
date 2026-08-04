const express = require("express");
const router = express.Router();
const tipController = require("../controllers/whistleblowerTip.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");
const tryCatchHandler = require("../../middleware/tryCatch");
const { logAction } = require("../../middleware/auditLog");
const { adminActionLimiter } = require("../../middleware/rateLimit");

router.post("/", protect, requireSuperAdmin, logAction, adminActionLimiter, tryCatchHandler(tipController.createTipHandler));
router.get("/", protect, requireSuperAdmin, logAction, adminActionLimiter, tryCatchHandler(tipController.listTipsHandler));
router.get("/stats", protect, requireSuperAdmin, logAction, adminActionLimiter, tryCatchHandler(tipController.getTipStatsHandler));
router.get("/:id", protect, requireSuperAdmin, logAction, adminActionLimiter, tryCatchHandler(tipController.getTipHandler));
router.patch("/:id", protect, requireSuperAdmin, logAction, adminActionLimiter, tryCatchHandler(tipController.updateTipHandler));

module.exports = router;
