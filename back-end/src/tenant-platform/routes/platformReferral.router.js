const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const platformReferralController = require("../controllers/platformReferral.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/referrals")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(platformReferralController.listReferralsHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(platformReferralController.createReferralHandler))
  .all(httpMethodError);

router
  .route("/referrals/:id")
  .patch(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(platformReferralController.updateReferralHandler))
  .all(httpMethodError);

module.exports = router;
