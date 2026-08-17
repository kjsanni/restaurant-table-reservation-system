const { mapInventoryItemToErpnext, mapSalonInventoryItem, mapRestaurantIngredient, mapStockEntry } = require("../integrations/erpnext/mappers/item.mapper");

describe("item.mapper", () => {
  const tenant = { id: 1, name: "Test Venue", currency: "GHS" };

  it("maps generic inventory item to ERPNext Item payload", () => {
    const item = { id: 10, name: "Generic Item", sku: "SKU-1", category: "Supplies", unit: "pcs", costPrice: 5, sellingPrice: 10, quantity: 20, reorderLevel: 3, isActive: true };
    const payload = mapInventoryItemToErpnext(item, tenant);
    expect(payload).toMatchObject({
      item_code: "SKU-1",
      item_name: "Generic Item",
      item_group: "Supplies",
      stock_uom: "pcs",
      valuation_rate: 5,
      standard_rate: 10,
      currency: "GHS",
      company: "Test Venue",
      is_stock_item: true,
      opening_qty: 20,
      reorder_level: 3,
      status: "Active",
    });
  });

  it("falls back to item name when sku is missing", () => {
    const item = { id: 11, name: "No SKU", costPrice: 1, sellingPrice: 2, quantity: 0, reorderLevel: 5, isActive: false };
    const payload = mapInventoryItemToErpnext(item, tenant);
    expect(payload.item_code).toBe("No SKU");
    expect(payload.status).toBe("Inactive");
  });

  it("maps salon inventory item with expiry and note", () => {
    const item = { id: 20, name: "Shampoo", sku: "SAL-1", category: "Hair Care", unit: "pcs", costPrice: 12.5, sellingPrice: 25, quantity: 8, reorderLevel: 2, isActive: true, expiryDate: "2027-01-01", note: "Bulk pack" };
    const payload = mapSalonInventoryItem(item, tenant);
    expect(payload).toMatchObject({
      item_group: "Hair Care",
      expiry_date: "2027-01-01",
      description: "Bulk pack",
      rtrs_source: "salon_inventory",
    });
    expect(payload.item_code).toBe("SAL-1");
  });

  it("maps restaurant ingredient stub", () => {
    const item = { id: 30, name: "Rice", sku: "R-1", category: "Grains", unit: "kg", costPrice: 8, sellingPrice: 12, quantity: 50, reorderLevel: 10, isActive: true, expiryDate: "2026-12-31", note: "Premium grade" };
    const payload = mapRestaurantIngredient(item, tenant);
    expect(payload).toMatchObject({
      item_group: "Grains",
      expiry_date: "2026-12-31",
      description: "Premium grade",
      rtrs_source: "restaurant_ingredient",
    });
    expect(payload.is_stock_item).toBe(true);
  });

  it("maps stock entry for issue and receipt", () => {
    const item = { id: 40, name: "Conditioner", sku: "SAL-2", unit: "pcs", costPrice: 15 };
    const issue = mapStockEntry(item, -5, "out", tenant);
    expect(issue.purpose).toBe("Material Issue");
    expect(issue.items[0].qty).toBe(5);
    expect(issue.items[0].amount).toBe(75);

    const receipt = mapStockEntry(item, 10, "in", tenant);
    expect(receipt.purpose).toBe("Material Receipt");
    expect(receipt.items[0].qty).toBe(10);
  });
});
