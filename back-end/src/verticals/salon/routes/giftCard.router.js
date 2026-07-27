"use strict";
const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../../middleware/tryCatch");
const httpMethodError = require("../../../middleware/httpMethodError");
const giftCardController = require("../controllers/giftCard.controller");
const { protect, requirePermission } = require("../../../middleware/auth");
const { requireVertical } = require("../../../middleware/requireVertical");

router
  .route("/")
  .get(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("view_appointments")),
    tryCatchHandler(giftCardController.getGiftCardsHandler)
  )
  .post(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("manage_settings")),
    tryCatchHandler(giftCardController.createGiftCardHandler)
  )
  .all(httpMethodError);

router
  .route("/:id")
  .get(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("view_appointments")),
    tryCatchHandler(giftCardController.getGiftCardHandler)
  )
  .patch(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("manage_settings")),
    tryCatchHandler(giftCardController.updateGiftCardHandler)
  )
  .delete(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("manage_settings")),
    tryCatchHandler(giftCardController.deleteGiftCardHandler)
  )
  .all(httpMethodError);

module.exports = router;
