"use strict";
const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../../middleware/tryCatch");
const httpMethodError = require("../../../middleware/httpMethodError");
const inventoryItemController = require("../controllers/inventoryItem.controller");
const { protect, requirePermission } = require("../../../middleware/auth");
const { requireVertical } = require("../../../middleware/requireVertical");

router
  .route("/")
  .get(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("view_reports")),
    tryCatchHandler(inventoryItemController.getInventoryItemsHandler)
  )
  .post(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("manage_settings")),
    tryCatchHandler(inventoryItemController.createInventoryItemHandler)
  )
  .all(httpMethodError);

router
  .route("/:id")
  .get(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("view_reports")),
    tryCatchHandler(inventoryItemController.getInventoryItemHandler)
  )
  .patch(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("manage_settings")),
    tryCatchHandler(inventoryItemController.updateInventoryItemHandler)
  )
  .delete(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("manage_settings")),
    tryCatchHandler(inventoryItemController.deleteInventoryItemHandler)
  )
  .all(httpMethodError);

router
  .route("/alerts/low-stock")
  .get(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("view_reports")),
    tryCatchHandler(inventoryItemController.getLowStockHandler)
  )
  .all(httpMethodError);

module.exports = router;
