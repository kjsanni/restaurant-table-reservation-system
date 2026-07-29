"use strict";

const mapInventoryItemToErpnext = (item, tenant) => {
  return {
    item_code: item.sku || item.name,
    item_name: item.name,
    item_group: item.category || "All Inventory Items",
    stock_uom: item.unit || "pcs",
    valuation_rate: parseFloat(item.costPrice || 0),
    standard_rate: parseFloat(item.sellingPrice || 0),
    currency: item.currency || "GHS",
    company: tenant.name,
    is_stock_item: true,
    opening_qty: item.quantity || 0,
    reorder_level: item.reorderLevel || 5,
    status: item.isActive !== false ? "Active" : "Inactive",
    rtrs_inventory_item_id: item.id,
    rtrs_tenant_id: tenant.id,
  };
};

const mapStockEntry = (item, quantity, type, tenant) => {
  return {
    doctype: "Stock Entry",
    purpose: type === "out" ? "Material Issue" : "Material Receipt",
    company: tenant.name,
    items: [
      {
        item_code: item.sku || item.name,
        qty: Math.abs(quantity),
        uom: item.unit || "pcs",
        rate: parseFloat(item.costPrice || 0),
        amount: Math.abs(quantity) * parseFloat(item.costPrice || 0),
        warehouse: "Stores - " + tenant.name,
      },
    ],
    rtrs_inventory_item_id: item.id,
    rtrs_tenant_id: tenant.id,
    rtrs_movement_type: type,
  };
};

module.exports = {
  mapInventoryItemToErpnext,
  mapStockEntry,
};