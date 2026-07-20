const menuDAO = require("../DAOs/menu.dao");

jest.mock("../DAOs/menu.dao", () => ({
  createCategory: jest.fn(),
  updateCategory: jest.fn(),
  deleteCategory: jest.fn(),
  getCategories: jest.fn(),
  createMenuItem: jest.fn(),
  updateMenuItem: jest.fn(),
  deleteMenuItem: jest.fn(),
  getMenuItems: jest.fn(),
  getAvailableMenuItems: jest.fn(),
  getMenuItemById: jest.fn(),
  createMenuItemOption: jest.fn(),
  updateMenuItemOption: jest.fn(),
  deleteMenuItemOption: jest.fn(),
  getMenuItemOptions: jest.fn(),
}));

const menuController = require("../controllers/menu.controller");

describe("menu.controller", () => {
  let req;
  let res;

  beforeEach(() => {
    req = { tenant: { id: 1 }, params: {}, query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe("getCategoriesHandler", () => {
    it("should return 200 with categories", async () => {
      menuDAO.getCategories.mockResolvedValue([{ id: 1, name: "Starters" }]);
      await menuController.getCategoriesHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, categories: [{ id: 1, name: "Starters" }] });
    });
  });

  describe("getMenuItemsHandler", () => {
    it("should return 200 with items", async () => {
      menuDAO.getMenuItems.mockResolvedValue([{ id: 1, name: "Jollof" }]);
      await menuController.getMenuItemsHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, items: [{ id: 1, name: "Jollof" }] });
    });

    it("should filter by categoryId", async () => {
      req.query.categoryId = "2";
      menuDAO.getMenuItems.mockResolvedValue([]);
      await menuController.getMenuItemsHandler(req, res);
      expect(menuDAO.getMenuItems).toHaveBeenCalledWith(1, { categoryId: "2" });
    });

    it("should filter available items", async () => {
      req.query.available = "true";
      menuDAO.getMenuItems.mockResolvedValue([]);
      await menuController.getMenuItemsHandler(req, res);
      expect(menuDAO.getMenuItems).toHaveBeenCalledWith(1, { isAvailable: true });
    });
  });

  describe("getAvailableMenuHandler", () => {
    it("should return 200 with available menu", async () => {
      menuDAO.getAvailableMenuItems.mockResolvedValue([{ id: 1, name: "Jollof" }]);
      await menuController.getAvailableMenuHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, menu: [{ id: 1, name: "Jollof" }] });
    });
  });

  describe("getMenuItemDetailHandler", () => {
    it("should return 200 with item detail", async () => {
      menuDAO.getMenuItemById.mockResolvedValue({ id: 1, name: "Jollof" });
      req.params.id = "1";
      await menuController.getMenuItemDetailHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, item: { id: 1, name: "Jollof" } });
    });

    it("should return 404 when item not found", async () => {
      menuDAO.getMenuItemById.mockResolvedValue(null);
      req.params.id = "999";
      await menuController.getMenuItemDetailHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "Menu item not found" });
    });
  });
});
