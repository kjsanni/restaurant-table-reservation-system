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
  const transfer = await inventoryTransferDao.findById(numericId, tenantId); // codacy-suppress NoSqlInjection
  if (!transfer) {
    return res.status(404).json({ success: false, message: "Transfer not found" });
  }
  if (transfer.status !== "pending" && transfer.status !== "in_transit") {
    return res.status(400).json({ success: false, message: "Transfer cannot be completed in its current status" });
  }

  const updated = await inventoryTransferDao.update(numericId, tenantId, { status: "completed" }); // codacy-suppress NoSqlInjection

  const inventoryItem = await db.inventoryItem.findOne({ // codacy-suppress NoSqlInjection
    where: { id: transfer.inventoryItemId, tenantId },
  });
  if (inventoryItem) {
    await inventoryItem.update({ quantity: inventoryItem.quantity + transfer.quantity });
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
