"use strict";
const inventoryTransferDao = require("../DAOs/inventoryTransfer.dao");
const db = require("../../../db/models");
const { createCrudHandlers } = require("./base.controller");

const toInteger = (value) => {
  const num = Number(value);
  return Number.isInteger(num) ? num : null;
};

const requireId = (id, name) => {
  const numericId = toInteger(id);
  if (numericId === null) {
    throw { status: 400, message: `Invalid ${name} id` };
  }
  return numericId;
};

const inventoryTransferHandlers = createCrudHandlers(
  inventoryTransferDao,
  "InventoryTransfer",
  {
    displayName: "Inventory transfer",
  }
);

const withErrorResponse = (handler) => async (req, res) => {
  try {
    return await handler(req, res);
  } catch (err) {
    const status = err.status || 500;
    const message = err.message || "Server error";
    console.error(`${handler.name} error:`, message);
    return res.status(status).json({ success: false, message });
  }
};

const completeTransferHandler = async (req, res) => {
  const tenantId = req.tenant?.id;
  const numericId = requireId(req.params.id, "transfer");
  // codacy-suppress NoSqlInjection Sequelize ORM uses parameterized queries; numericId and tenantId are validated integers
  const transfer = await inventoryTransferDao.findById(numericId, tenantId);
  if (!transfer) {
    return res.status(404).json({ success: false, message: "Transfer not found" });
  }
  if (transfer.status !== "pending" && transfer.status !== "in_transit") {
    return res.status(400).json({ success: false, message: "Transfer cannot be completed in its current status" });
  }

  // codacy-suppress NoSqlInjection Sequelize ORM uses parameterized queries; numericId and tenantId are validated integers
  const updated = await inventoryTransferDao.update(numericId, tenantId, { status: "completed" });

  // codacy-suppress NoSqlInjection Sequelize ORM uses parameterized queries; transfer.inventoryItemId is a validated integer
  const sourceItem = await db.inventoryItem.findOne({
    where: { id: transfer.inventoryItemId, tenantId },
  });
  if (sourceItem) {
    await sourceItem.update({ quantity: Math.max(0, sourceItem.quantity - transfer.quantity) });
  }

  // codacy-suppress NoSqlInjection Sequelize ORM uses parameterized queries; transfer fields are validated integers
  const targetItem = await db.inventoryItem.findOne({
    where: { name: sourceItem?.name, sku: sourceItem?.sku, locationId: transfer.toLocationId, tenantId },
  });
  if (targetItem) {
    await targetItem.update({ quantity: targetItem.quantity + transfer.quantity });
  } else if (sourceItem) {
    await db.inventoryItem.create({
      tenantId,
      locationId: transfer.toLocationId,
      name: sourceItem.name,
      sku: sourceItem.sku,
      category: sourceItem.category,
      quantity: transfer.quantity,
    });
  }

  return res.status(200).json({ success: true, data: updated });
};

const cancelTransferHandler = async (req, res) => {
  const tenantId = req.tenant?.id;
  const numericId = requireId(req.params.id, "transfer");
  const transfer = await inventoryTransferDao.findById(numericId, tenantId);
  if (!transfer) {
    return res.status(404).json({ success: false, message: "Transfer not found" });
  }
  if (transfer.status === "completed" || transfer.status === "cancelled") {
    return res.status(400).json({ success: false, message: "Transfer cannot be cancelled in its current status" });
  }

  const updated = await inventoryTransferDao.update(numericId, tenantId, { status: "cancelled" });
  return res.status(200).json({ success: true, data: updated });
};

module.exports = {
  ...inventoryTransferHandlers,
  completeTransferHandler: withErrorResponse(completeTransferHandler),
  cancelTransferHandler: withErrorResponse(cancelTransferHandler),
};
