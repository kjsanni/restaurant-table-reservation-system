"use strict";
const express = require("express");
const router = express.Router();
const httpMethodError = require("../../../middleware/httpMethodError");
const tryCatchHandler = require("../../../middleware/tryCatch");
const marketingCampaignController = require("../controllers/marketing-campaign.controller");
const { protect, requirePermission } = require("../../../middleware/auth");
const { requireVertical } = require("../../../middleware/requireVertical");

router
  .route("/")
  .get(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("manage_settings")),
    tryCatchHandler(marketingCampaignController.getMarketingCampaignsHandler)
  )
  .post(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("manage_settings")),
    tryCatchHandler(marketingCampaignController.createMarketingCampaignHandler)
  )
  .all(httpMethodError);

router
  .route("/:id")
  .patch(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("manage_settings")),
    tryCatchHandler(marketingCampaignController.updateMarketingCampaignHandler)
  )
  .delete(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("manage_settings")),
    tryCatchHandler(marketingCampaignController.deleteMarketingCampaignHandler)
  )
  .post(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("manage_settings")),
    tryCatchHandler(marketingCampaignController.sendMarketingCampaignHandler)
  )
  .all(httpMethodError);

module.exports = router;
