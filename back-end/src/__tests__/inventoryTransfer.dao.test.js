const db = require("../db/models");
const inventoryTransferDAO = require("../verticals/salon/DAOs/inventoryTransfer.dao");

jest.mock("../db/models", () => {
  const mockInventoryTransfer = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  };

  const mockLocation = {
    name: "Location",
  };

  const mockInventoryItem = {
    name: "Item",
    sku: "SKU-1",
  };

  return {
    inventoryTransfer: mockInventoryTransfer,
    location: mockLocation,
    inventoryItem: mockInventoryItem,
  };
});

describe("inventoryTransfer.dao", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("findAllForTenant", () => {
    it("should return transfers for a tenant", async () => {
      const mockTransfers = [
        { id: 1, tenantId: 1, quantity: 10, status: "pending" },
        { id: 2, tenantId: 1, quantity: 5, status: "completed" },
      ];
      db.inventoryTransfer.findAll.mockResolvedValue(mockTransfers);

      const result = await inventoryTransferDAO.findAllForTenant(1);

      expect(db.inventoryTransfer.findAll).toHaveBeenCalledWith({
        where: { tenantId: 1 },
        include: expect.any(Array),
        order: [["createdAt", "DESC"]],
        limit: 100,
        offset: 0,
      });
      expect(result).toEqual(mockTransfers);
    });

    it("should apply status filter", async () => {
      db.inventoryTransfer.findAll.mockResolvedValue([]);

      await inventoryTransferDAO.findAllForTenant(1, { status: "completed" });

      expect(db.inventoryTransfer.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 1, status: "completed" },
        })
      );
    });

    it("should apply location and item filters", async () => {
      db.inventoryTransfer.findAll.mockResolvedValue([]);

      await inventoryTransferDAO.findAllForTenant(1, {
        fromLocationId: 2,
        toLocationId: 3,
        inventoryItemId: 5,
      });

      expect(db.inventoryTransfer.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tenantId: 1,
            fromLocationId: 2,
            toLocationId: 3,
            inventoryItemId: 5,
          },
        })
      );
    });
  });

  describe("findById", () => {
    it("should return a transfer by id and tenant", async () => {
      const mockTransfer = { id: 1, tenantId: 1, quantity: 10 };
      db.inventoryTransfer.findOne.mockResolvedValue(mockTransfer);

      const result = await inventoryTransferDAO.findById(1, 1);

      expect(db.inventoryTransfer.findOne).toHaveBeenCalledWith({
        where: { id: 1, tenantId: 1 },
        include: expect.any(Array),
      });
      expect(result).toEqual(mockTransfer);
    });

    it("should return null when not found", async () => {
      db.inventoryTransfer.findOne.mockResolvedValue(null);

      const result = await inventoryTransferDAO.findById(999, 1);

      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("should create a transfer with tenantId", async () => {
      const mockTransfer = { id: 1, tenantId: 1, quantity: 10 };
      db.inventoryTransfer.create.mockResolvedValue(mockTransfer);

      const result = await inventoryTransferDAO.create(
        { inventoryItemId: 1, quantity: 10 },
        1
      );

      expect(db.inventoryTransfer.create).toHaveBeenCalledWith({
        inventoryItemId: 1,
        quantity: 10,
        tenantId: 1,
      });
      expect(result).toEqual(mockTransfer);
    });
  });

  describe("update", () => {
    it("should update and return the transfer", async () => {
      const mockTransfer = {
        id: 1,
        tenantId: 1,
        quantity: 10,
        update: jest.fn().mockResolvedValue(true),
      };
      db.inventoryTransfer.findOne.mockResolvedValue(mockTransfer);

      const result = await inventoryTransferDAO.update(1, 1, {
        status: "completed",
      });

      expect(mockTransfer.update).toHaveBeenCalledWith({ status: "completed" });
      expect(result).toEqual(mockTransfer);
    });

    it("should return null when transfer not found", async () => {
      db.inventoryTransfer.findOne.mockResolvedValue(null);

      const result = await inventoryTransferDAO.update(999, 1, {
        status: "completed",
      });

      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    it("should delete and return true", async () => {
      const mockTransfer = {
        id: 1,
        tenantId: 1,
        destroy: jest.fn().mockResolvedValue(true),
      };
      db.inventoryTransfer.findOne.mockResolvedValue(mockTransfer);

      const result = await inventoryTransferDAO.delete(1, 1);

      expect(mockTransfer.destroy).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it("should return false when transfer not found", async () => {
      db.inventoryTransfer.findOne.mockResolvedValue(null);

      const result = await inventoryTransferDAO.delete(999, 1);

      expect(result).toBe(false);
    });
  });
});
