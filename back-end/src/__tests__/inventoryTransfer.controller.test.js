jest.mock("../verticals/salon/DAOs/inventoryTransfer.dao");
jest.mock("../db/models", () => {
  const mockFindOne = jest.fn();
  return {
    inventoryItem: {
      findOne: mockFindOne,
    },
    inventoryTransfer: {
      findOne: jest.fn(),
    },
    location: {
      name: "Location",
    },
  };
});

const inventoryTransferController = require("../verticals/salon/controllers/inventoryTransfer.controller");

describe("inventoryTransfer.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockReq = (overrides = {}) => ({
    tenant: { id: 1 },
    params: {},
    body: {},
    query: {},
    ...overrides,
  });

  const mockRes = () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    return res;
  };

  describe("getInventoryTransfersHandler", () => {
    it("should return paginated transfers", async () => {
      const dao = require("../verticals/salon/DAOs/inventoryTransfer.dao");
      dao.findAll.mockResolvedValue([
        { id: 1, quantity: 10 },
        { id: 2, quantity: 5 },
      ]);

      const req = mockReq({ query: { page: "1", pageSize: "10" } });
      const res = mockRes();

      await inventoryTransferController.getInventoryTransfersHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [
          { id: 1, quantity: 10 },
          { id: 2, quantity: 5 },
        ],
      });
    });
  });

  describe("getInventoryTransferHandler", () => {
    it("should return a single transfer", async () => {
      const dao = require("../verticals/salon/DAOs/inventoryTransfer.dao");
      dao.findById.mockResolvedValue({ id: 1, quantity: 10 });

      const req = mockReq({ params: { id: "1" } });
      const res = mockRes();

      await inventoryTransferController.getInventoryTransferHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { id: 1, quantity: 10 },
      });
    });

    it("should return 404 when transfer not found", async () => {
      const dao = require("../verticals/salon/DAOs/inventoryTransfer.dao");
      dao.findById.mockResolvedValue(null);

      const req = mockReq({ params: { id: "999" } });
      const res = mockRes();

      await inventoryTransferController.getInventoryTransferHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Inventory transfer not found",
      });
    });
  });

  describe("createInventoryTransferHandler", () => {
    it("should create a transfer", async () => {
      const dao = require("../verticals/salon/DAOs/inventoryTransfer.dao");
      dao.create.mockResolvedValue({ id: 1, quantity: 10 });

      const req = mockReq({
        body: { inventoryItemId: 1, quantity: 10, fromLocationId: 2, toLocationId: 3 },
      });
      const res = mockRes();

      await inventoryTransferController.createInventoryTransferHandler(req, res);

      expect(dao.create).toHaveBeenCalledWith(
        { inventoryItemId: 1, quantity: 10, fromLocationId: 2, toLocationId: 3 },
        1
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { id: 1, quantity: 10 },
      });
    });
  });

  describe("updateInventoryTransferHandler", () => {
    it("should update a transfer", async () => {
      const dao = require("../verticals/salon/DAOs/inventoryTransfer.dao");
      dao.update.mockResolvedValue({ id: 1, status: "completed" });

      const req = mockReq({
        params: { id: "1" },
        body: { status: "completed" },
      });
      const res = mockRes();

      await inventoryTransferController.updateInventoryTransferHandler(req, res);

      expect(dao.update).toHaveBeenCalledWith("1", 1, { status: "completed" });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { id: 1, status: "completed" },
      });
    });

    it("should return 404 when transfer not found", async () => {
      const dao = require("../verticals/salon/DAOs/inventoryTransfer.dao");
      dao.update.mockResolvedValue(null);

      const req = mockReq({
        params: { id: "999" },
        body: { status: "completed" },
      });
      const res = mockRes();

      await inventoryTransferController.updateInventoryTransferHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Inventory transfer not found",
      });
    });
  });

  describe("deleteInventoryTransferHandler", () => {
    it("should delete a transfer", async () => {
      const dao = require("../verticals/salon/DAOs/inventoryTransfer.dao");
      dao.delete.mockResolvedValue(true);

      const req = mockReq({ params: { id: "1" } });
      const res = mockRes();

      await inventoryTransferController.deleteInventoryTransferHandler(req, res);

      expect(dao.delete).toHaveBeenCalledWith("1", 1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it("should return 404 when transfer not found", async () => {
      const dao = require("../verticals/salon/DAOs/inventoryTransfer.dao");
      dao.delete.mockResolvedValue(false);

      const req = mockReq({ params: { id: "999" } });
      const res = mockRes();

      await inventoryTransferController.deleteInventoryTransferHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Inventory transfer not found",
      });
    });
  });

  describe("completeTransferHandler", () => {
    it("should complete a pending transfer and update inventory", async () => {
      const db = require("../db/models");
      const dao = require("../verticals/salon/DAOs/inventoryTransfer.dao");
      db.inventoryItem.findOne
        .mockResolvedValueOnce({
          id: 1,
          name: "Shampoo",
          sku: "SH-001",
          category: "Hair",
          quantity: 100,
          update: jest.fn().mockResolvedValue(true),
        })
        .mockResolvedValueOnce(null);
      db.inventoryItem.create = jest.fn().mockResolvedValue({ id: 2, quantity: 10 });
      dao.findById.mockResolvedValue({
        id: 1,
        tenantId: 1,
        status: "pending",
        inventoryItemId: 1,
        quantity: 10,
        fromLocationId: 2,
        toLocationId: 3,
      });
      dao.update.mockResolvedValue({ id: 1, status: "completed" });

      const req = mockReq({ params: { id: "1" } });
      const res = mockRes();

      await inventoryTransferController.completeTransferHandler(req, res);

      expect(dao.update).toHaveBeenCalledWith(1, 1, { status: "completed" });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { id: 1, status: "completed" },
      });
    });

    it("should reject completion of already completed transfer", async () => {
      const dao = require("../verticals/salon/DAOs/inventoryTransfer.dao");
      dao.findById.mockResolvedValue({
        id: 1,
        tenantId: 1,
        status: "completed",
      });

      const req = mockReq({ params: { id: "1" } });
      const res = mockRes();

      await inventoryTransferController.completeTransferHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Transfer cannot be completed in its current status",
      });
    });

    it("should return 404 when transfer not found", async () => {
      const dao = require("../verticals/salon/DAOs/inventoryTransfer.dao");
      dao.findById.mockResolvedValue(null);

      const req = mockReq({ params: { id: "999" } });
      const res = mockRes();

      await inventoryTransferController.completeTransferHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Transfer not found",
      });
    });
  });

  describe("cancelTransferHandler", () => {
    it("should cancel a pending transfer", async () => {
      const dao = require("../verticals/salon/DAOs/inventoryTransfer.dao");
      dao.findById.mockResolvedValue({
        id: 1,
        tenantId: 1,
        status: "pending",
      });
      dao.update.mockResolvedValue({ id: 1, status: "cancelled" });

      const req = mockReq({ params: { id: "1" } });
      const res = mockRes();

      await inventoryTransferController.cancelTransferHandler(req, res);

      expect(dao.update).toHaveBeenCalledWith(1, 1, { status: "cancelled" });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { id: 1, status: "cancelled" },
      });
    });

    it("should reject cancellation of completed transfer", async () => {
      const dao = require("../verticals/salon/DAOs/inventoryTransfer.dao");
      dao.findById.mockResolvedValue({
        id: 1,
        tenantId: 1,
        status: "completed",
      });

      const req = mockReq({ params: { id: "1" } });
      const res = mockRes();

      await inventoryTransferController.cancelTransferHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Transfer cannot be cancelled in its current status",
      });
    });

    it("should return 404 when transfer not found", async () => {
      const dao = require("../verticals/salon/DAOs/inventoryTransfer.dao");
      dao.findById.mockResolvedValue(null);

      const req = mockReq({ params: { id: "999" } });
      const res = mockRes();

      await inventoryTransferController.cancelTransferHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Transfer not found",
      });
    });
  });
});
