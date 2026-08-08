"use strict";
const inventoryTransferDao = require("../DAOs/inventoryTransfer.dao");
const db = require("../../../db/models");
const { createCrudHandlers } = require("./base.controller");

const inventoryTransferHandlers = createCrudHandlers(
  inventoryTransferDao,
  "InventoryTransfer",
  {
    displayName: "Inventory transfer",
  }
);

const completeTransferHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { id } = req.params;
    const transfer = await inventoryTransferDao.findById(id, tenantId);
    if (!transfer) {
      return res.status(404).json({ success: false, message: "Transfer not found" });
    }
    if (transfer.status !== "pending" && transfer.status !== "in_transit") {
      return res.status(400).json({ success: false, message: "Transfer cannot be completed in its current status" });
    }

    const t = await db.sequelize.transaction();
    try {
      const sourceItem = await db.inventoryItem.findOne({
        where: { id: transfer.inventoryItemId, tenantId },
        transaction: t,
      });
      if (!sourceItem || sourceItem.quantity < transfer.quantity) {
        await t.rollback();
        return res.status(400).json({ success: false, message: "Insufficient stock at source location" });
      }

      await sourceItem.update({ quantity: sourceItem.quantity - transfer.quantity }, { transaction: t });

      const targetItem = await db.inventoryItem.findOne({
        where: { sku: sourceItem.sku, name: sourceItem.name, locationId: transfer.toLocationId, tenantId },
        transaction: t,
      });

      if (targetItem) {
        await targetItem.update({ quantity: targetItem.quantity + transfer.quantity }, { transaction: t });
      } else {
        await db.inventoryItem.create(
          {
            tenantId,
            name: sourceItem.name,
            sku: sourceItem.sku,
            category: sourceItem.category,
            quantity: transfer.quantity,
            unit: sourceItem.unit,
            costPrice: sourceItem.costPrice,
            sellingPrice: sourceItem.sellingPrice,
            currency: sourceItem.currency,
            reorderLevel: sourceItem.reorderLevel,
            expiryDate: sourceItem.expiryDate,
            isActive: sourceItem.isActive,
            note: sourceItem.note,
            locationId: transfer.toLocationId,
          },
          { transaction: t }
        );
      }

      const updated = await inventoryTransferDao.update(id, tenantId, { status: "completed" }, t);

      await t.commit();
      return res.status(200).json({ success: true, data: updated });
    } catch (err) {
      await t.rollback();
      throw err;
    }
  } catch (err) {
    console.error("completeTransferHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to complete transfer" });
  }
};

const cancelTransferHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { id } = req.params;
    const transfer = await inventoryTransferDao.findById(id, tenantId);
    if (!transfer) {
      return res.status(404).json({ success: false, message: "Transfer not found" });
    }
    if (transfer.status === "completed" || transfer.status === "cancelled") {
      return res.status(400).json({ success: false, message: "Transfer cannot be cancelled in its current status" });
    }

    const updated = await inventoryTransferDao.update(id, tenantId, { status: "cancelled" });
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error("cancelTransferHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to cancel transfer" });
  }
};

module.exports = {
  ...inventoryTransferHandlers,
  completeTransferHandler,
  cancelTransferHandler,
};
