"use strict";
const router = require("express").Router();
const inventoryTransferController = require("../controllers/inventoryTransfer.controller");
const { protect, requirePermission } = require("../../../middleware/auth");
const { requireVertical } = require("../../../middleware/requireVertical");
const { generalLimiter } = require("../../../middleware/rateLimit");

router.use(generalLimiter);

router.use(protect, requireVertical("salon"), requirePermission("edit_appointments"));

router.route("/").get(inventoryTransferController.getInventoryTransfersHandler).post(inventoryTransferController.createInventoryTransferHandler);

router.route("/:id").get(inventoryTransferController.getInventoryTransferHandler).patch(inventoryTransferController.updateInventoryTransferHandler).delete(inventoryTransferController.deleteInventoryTransferHandler);

router.patch("/:id/complete", inventoryTransferController.completeTransferHandler);

router.patch("/:id/cancel", inventoryTransferController.cancelTransferHandler);

module.exports = router;
