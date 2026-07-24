const clientSegmentationController = require("../verticals/salon/controllers/client-segmentation.controller");
const salonClientProfileDao = require("../verticals/salon/DAOs/salonClientProfile.dao");

jest.mock("../verticals/salon/DAOs/salonClientProfile.dao");

describe("client-segmentation.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const buildReq = (overrides = {}) => ({
    tenant: { id: 1 },
    body: {},
    ...overrides,
  });

  describe("getClientSegmentationHandler", () => {
    it("returns segmentation summary", async () => {
      salonClientProfileDao.getSegmentation.mockResolvedValue([
        { tier: "gold", count: 5, totalSpent: 1200, avgVisits: 12 },
      ]);
      const req = buildReq();
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

      await clientSegmentationController.getClientSegmentationHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, segmentation: [{ tier: "gold", count: 5, totalSpent: 1200, avgVisits: 12 }] });
    });
  });

  describe("recordClientVisitHandler", () => {
    it("records visit and updates tier", async () => {
      salonClientProfileDao.recordVisit.mockResolvedValue({ id: 1, tier: "gold" });
      const req = buildReq({ body: { customerId: 1, amount: 100 } });
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

      await clientSegmentationController.recordClientVisitHandler(req, res);

      expect(salonClientProfileDao.recordVisit).toHaveBeenCalledWith(1, 1, 100);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("markClientNoShowHandler", () => {
    it("increments no-show count", async () => {
      salonClientProfileDao.markNoShow.mockResolvedValue({ id: 1, noShowCount: 2 });
      const req = buildReq({ body: { customerId: 1 } });
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

      await clientSegmentationController.markClientNoShowHandler(req, res);

      expect(salonClientProfileDao.markNoShow).toHaveBeenCalledWith(1, 1);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
