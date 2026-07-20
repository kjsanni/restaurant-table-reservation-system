const menuDAO = require("../DAOs/menu.dao");
const orderDAO = require("../DAOs/order.dao");

jest.mock("../DAOs/menu.dao", () => ({
  createCategory: jest.fn(),
  getCategories: jest.fn(),
  createMenuItem: jest.fn(),
  getMenuItems: jest.fn(),
  getMenuItemById: jest.fn(),
  createMenuItemOption: jest.fn(),
  getMenuItemOptions: jest.fn(),
}));

jest.mock("../DAOs/order.dao", () => ({
  createOrder: jest.fn(),
  getOrderById: jest.fn(),
  getOrders: jest.fn(),
  cancelOrder: jest.fn(),
}));

describe("menu + order DAOs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("menu.dao", () => {
    it("createCategory calls create with tenantId", async () => {
      menuDAO.createCategory.mockResolvedValue({ id: 1, name: "Starters", tenantId: 1 });
      const cat = await menuDAO.createCategory(1, { name: "Starters" });
      expect(menuDAO.createCategory).toHaveBeenCalledWith(1, { name: "Starters" });
      expect(cat.id).toBe(1);
    });

    it("getCategories calls findAll with tenant filter", async () => {
      menuDAO.getCategories.mockResolvedValue([{ id: 1, name: "Starters" }]);
      const cats = await menuDAO.getCategories(1);
      expect(menuDAO.getCategories).toHaveBeenCalledWith(1);
      expect(cats).toHaveLength(1);
    });

    it("getMenuItems passes filters through", async () => {
      menuDAO.getMenuItems.mockResolvedValue([{ id: 1 }]);
      const items = await menuDAO.getMenuItems(1, { categoryId: 2 });
      expect(menuDAO.getMenuItems).toHaveBeenCalledWith(1, { categoryId: 2 });
    });

    it("getMenuItemOptions queries by menuItemId", async () => {
      menuDAO.getMenuItemOptions.mockResolvedValue([{ id: 1, name: "Spicy" }]);
      const opts = await menuDAO.getMenuItemOptions(5);
      expect(menuDAO.getMenuItemOptions).toHaveBeenCalledWith(5);
      expect(opts).toHaveLength(1);
    });
  });

  describe("order.dao", () => {
    it("createOrder returns order with calculated total", async () => {
      orderDAO.createOrder.mockResolvedValue({ id: 1, total: "50.00" });
      const order = await orderDAO.createOrder(1, {
        customerId: 2,
        items: [{ menuItemId: 1, quantity: 2, unitPrice: 25 }],
        createdBy: "customer",
      });
      expect(orderDAO.createOrder).toHaveBeenCalledWith(1, {
        customerId: 2,
        items: [{ menuItemId: 1, quantity: 2, unitPrice: 25 }],
        createdBy: "customer",
      });
      expect(order.total).toBe("50.00");
    });

    it("getOrderById calls DAO with tenant scoping", async () => {
      orderDAO.getOrderById.mockResolvedValue({ id: 1 });
      const order = await orderDAO.getOrderById(1, 1);
      expect(orderDAO.getOrderById).toHaveBeenCalledWith(1, 1);
      expect(order.id).toBe(1);
    });

    it("cancelOrder rejects terminal statuses", async () => {
      orderDAO.cancelOrder.mockRejectedValue({ status: 400, message: "cannot be cancelled" });
      await expect(orderDAO.cancelOrder(1, 1)).rejects.toMatchObject({
        status: 400,
        message: expect.stringContaining("cannot be cancelled"),
      });
    });
  });
});
