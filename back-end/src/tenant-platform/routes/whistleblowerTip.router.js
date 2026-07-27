const express = require("express");
const router = express.Router();
const tipController = require("../controllers/whistleblowerTip.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");
const tryCatchHandler = require("../../middleware/tryCatch");

router.use(protect, requireSuperAdmin);

router.post("/", tryCatchHandler(tipController.createTipHandler));
router.get("/", tryCatchHandler(tipController.listTipsHandler));
router.get("/stats", tryCatchHandler(tipController.getTipStatsHandler));
router.get("/:id", tryCatchHandler(tipController.getTipHandler));
router.patch("/:id", tryCatchHandler(tipController.updateTipHandler));

module.exports = router;
