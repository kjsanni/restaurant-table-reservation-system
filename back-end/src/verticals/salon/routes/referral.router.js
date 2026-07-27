"use strict";
const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../../middleware/tryCatch");
const httpMethodError = require("../../../middleware/httpMethodError");
const referralController = require("../controllers/referral.controller");
const { protect, requirePermission } = require("../../../middleware/auth");
const { requireVertical } = require("../../../middleware/requireVertical");

router
  .route("/")
  .get(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("view_appointments")),
    tryCatchHandler(referralController.getReferralsHandler)
  )
  .post(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("manage_settings")),
    tryCatchHandler(referralController.createReferralHandler)
  )
  .all(httpMethodError);

router
  .route("/:id")
  .get(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("view_appointments")),
    tryCatchHandler(referralController.getReferralHandler)
  )
  .patch(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("manage_settings")),
    tryCatchHandler(referralController.updateReferralHandler)
  )
  .delete(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("manage_settings")),
    tryCatchHandler(referralController.deleteReferralHandler)
  )
  .all(httpMethodError);

module.exports = router;
