"use strict";

const { getClient } = require("../client");
const { mapSalonInventoryItem, mapRestaurantIngredient } = require("../mappers/item.mapper");
const db = require("../../../db/models");

const resolveMapper = (item) => {
  if (item.constructor?.modelName === "inventoryItem") {
    return mapSalonInventoryItem;
  }
  return mapRestaurantIngredient;
};

const createOrUpdateErpnextItem = async (item, tenantId) => {
  const tenant = await db.tenant.findByPk(tenantId);
  if (!tenant) throw new Error(`Tenant ${tenantId} not found`);

  const mapper = resolveMapper(item);
  const payload = mapper(item, tenant);

// codacy-suppress NoSqlInjection
  const existing = await db.erpnextSync.findOne({
    where: {
      tenantId,
      rtrsEntityType: "inventory_item",
      rtrsEntityId: item.id,
    },
  });

  if (existing && existing.erpnextDocname) {
    const result = await (await getClient()).put(`/api/resource/Item/${existing.erpnextDocname}`, payload);
    return result.data;
  }

  const result = await (await getClient()).post("/api/resource/Item", payload);
  const erpnextItem = result.data.data;

  await db.erpnextSync.upsert({
    tenantId,
    rtrsEntityType: "inventory_item",
    rtrsEntityId: item.id,
    erpnextDocType: "Item",
    erpnextDocname: erpnextItem.name,
    erpnextDocStatus: erpnextItem.status || "Active",
  });

  return erpnextItem;
};

const syncItem = async (tenantId, itemId) => {
  const item = await db.inventoryItem.findByPk(itemId, {
    where: { tenantId },
  });
  if (!item) {
    throw new Error(`Inventory item ${itemId} not found for tenant ${tenantId}`);
  }
  return createOrUpdateErpnextItem(item, tenantId);
};

const syncAllItems = async (tenantId) => {
  const items = await db.inventoryItem.findAll({ where: { tenantId } });
  const results = [];
  for (const item of items) {
    try {
      const result = await createOrUpdateErpnextItem(item, tenantId);
      results.push({ itemId: item.id, status: "success", erpnextName: result.name });
    } catch (err) {
      results.push({ itemId: item.id, status: "failed", error: err.message });
    }
  }
  return results;
};

module.exports = {
  syncItem,
  syncAllItems,
};