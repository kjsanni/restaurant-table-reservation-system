"use strict";

const express = require("express");
const router = express.Router();
const { generalLimiter } = require("../middleware/rateLimit");
router.use(generalLimiter);
const tryCatchHandler = require("../middleware/tryCatch");
const { protect } = require("../middleware/auth");
const unifiedCustomerController = require("../controllers/unifiedCustomer.controller");

router
  .route("/profile")
  .get(tryCatchHandler(protect), tryCatchHandler(unifiedCustomerController.getUnifiedProfileHandler))
  .all((req, res) => res.status(405).json({ success: false, message: "Method not allowed" }));

router
  .route("/history")
  .get(tryCatchHandler(protect), tryCatchHandler(unifiedCustomerController.getCrossVerticalHistoryHandler))
  .all((req, res) => res.status(405).json({ success: false, message: "Method not allowed" }));

router
  .route("/loyalty/add")
  .post(tryCatchHandler(protect), tryCatchHandler(unifiedCustomerController.addLoyaltyPointsHandler))
  .all((req, res) => res.status(405).json({ success: false, message: "Method not allowed" }));

router
  .route("/loyalty/redeem")
  .post(tryCatchHandler(protect), tryCatchHandler(unifiedCustomerController.redeemLoyaltyPointsHandler))
  .all((req, res) => res.status(405).json({ success: false, message: "Method not allowed" }));

module.exports = router;
