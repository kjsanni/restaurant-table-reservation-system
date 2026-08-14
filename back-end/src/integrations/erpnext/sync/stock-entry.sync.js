"use strict";

const { getClient } = require("../client");
const { mapSalonInventoryItem, mapStockEntry } = require("../mappers/item.mapper");
const db = require("../../../db/models");

const createStockEntry = async (item, quantity, type, tenantId) => {
  const tenant = await db.tenant.findByPk(tenantId);
  if (!tenant) throw new Error(`Tenant ${tenantId} not found`);

  const payload = mapStockEntry(item, quantity, type, tenant);

  const result = await (await getClient()).post("/api/resource/Stock Entry", payload);
  const stockEntry = result.data.data;

  await db.erpnextSync.upsert({
    tenantId,
    rtrsEntityType: "stock_entry",
    rtrsEntityId: item.id,
    erpnextDocType: "Stock Entry",
    erpnextDocname: stockEntry.name,
    erpnextDocStatus: stockEntry.status || "Draft",
  });

  return stockEntry;
};

const syncStockEntry = async (tenantId, itemId, quantity, type) => {
  const item = await db.inventoryItem.findByPk(itemId, {
    where: { tenantId },
  });
  if (!item) {
    throw new Error(`Inventory item ${itemId} not found for tenant ${tenantId}`);
  }
  return createStockEntry(item, quantity, type, tenantId);
};

const syncStockAdjustments = async (tenantId) => {
  const items = await db.inventoryItem.findAll({ where: { tenantId } });
  const results = [];
  for (const item of items) {
    try {
      if (item.quantity > 0) {
        await createStockEntry(item, item.quantity, "in", tenantId);
        results.push({ itemId: item.id, status: "success", action: "receipt" });
      }
    } catch (err) {
      results.push({ itemId: item.id, status: "failed", error: err.message });
    }
  }
  return results;
};

module.exports = {
  syncStockEntry,
  syncStockAdjustments,
};