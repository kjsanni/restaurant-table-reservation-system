const express = require("express");
const router = express.Router();
const tipController = require("../controllers/whistleblowerTip.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");
const tryCatchHandler = require("../../middleware/tryCatch");
const { logAction } = require("../../middleware/auditLog");
const { adminActionLimiter } = require("../../middleware/rateLimit");

// codeql[js/missing-rate-limiting] adminActionLimiter is applied below.
router.use(protect, requireSuperAdmin, adminActionLimiter, logAction);

router.post("/", tryCatchHandler(tipController.createTipHandler));
router.get("/", tryCatchHandler(tipController.listTipsHandler));
router.get("/stats", tryCatchHandler(tipController.getTipStatsHandler));
router.get("/:id", tryCatchHandler(tipController.getTipHandler));
router.patch("/:id", tryCatchHandler(tipController.updateTipHandler));

module.exports = router;
