jest.mock("../verticals/salon/DAOs/appointment.dao", () => ({
  getLocationSummary: jest.fn(),
  getTodayStats: jest.fn(),
}));
jest.mock("../verticals/salon/DAOs/location.dao", () => ({
  findAllForTenant: jest.fn(),
}));
jest.mock("../verticals/salon/DAOs/staff.dao", () => ({
  findAllForTenant: jest.fn(),
}));
jest.mock("../verticals/salon/DAOs/station.dao", () => ({
  findAllForTenant: jest.fn(),
}));

const appointmentDao = require("../verticals/salon/DAOs/appointment.dao");
const locationDao = require("../verticals/salon/DAOs/location.dao");
const staffDao = require("../verticals/salon/DAOs/staff.dao");
const stationDao = require("../verticals/salon/DAOs/station.dao");
const crossLocationDashboardController = require("../controllers/cross-location-dashboard.controller");

describe("cross-location-dashboard.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockReq = (overrides = {}) => ({
    tenant: { id: 1 },
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

  describe("getCrossLocationDashboardHandler", () => {
    it("should return aggregated dashboard data", async () => {
      locationDao.findAllForTenant.mockResolvedValue([
        { id: 1, name: "Location A" },
        { id: 2, name: "Location B" },
      ]);
      appointmentDao.getLocationSummary.mockResolvedValue([
        { locationId: 1, revenue: 1000, appointmentCount: 5 },
        { locationId: 2, revenue: 2000, appointmentCount: 8 },
      ]);
      staffDao.findAllForTenant.mockResolvedValue({ data: [{ id: 1 }, { id: 2 }] });
      stationDao.findAllForTenant.mockResolvedValue({ data: [{ id: 1 }, { id: 2 }, { id: 3 }] });
      appointmentDao.getTodayStats.mockResolvedValue({
        appointmentsToday: 3,
        revenueToday: 500,
      });

      const req = mockReq({ query: { from: "2026-08-01", to: "2026-08-07" } });
      const res = mockRes();

      await crossLocationDashboardController.getCrossLocationDashboardHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        summary: {
          totalLocations: 2,
          totalStaff: 2,
          totalStations: 3,
          totalRevenue: 3000,
          totalAppointments: 13,
          appointmentsToday: 3,
          revenueToday: 500,
        },
        locations: [
          { locationId: 1, revenue: 1000, appointmentCount: 5 },
          { locationId: 2, revenue: 2000, appointmentCount: 8 },
        ],
      });
    });

    it("should return 400 when tenant context is missing", async () => {
      const req = mockReq({ tenant: null });
      const res = mockRes();

      await crossLocationDashboardController.getCrossLocationDashboardHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Tenant context required",
      });
    });

    it("should handle empty location summary", async () => {
      locationDao.findAllForTenant.mockResolvedValue([]);
      appointmentDao.getLocationSummary.mockResolvedValue([]);
      staffDao.findAllForTenant.mockResolvedValue([]);
      stationDao.findAllForTenant.mockResolvedValue([]);
      appointmentDao.getTodayStats.mockResolvedValue({
        appointmentsToday: 0,
        revenueToday: 0,
      });

      const req = mockReq();
      const res = mockRes();

      await crossLocationDashboardController.getCrossLocationDashboardHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        summary: {
          totalLocations: 0,
          totalStaff: 0,
          totalStations: 0,
          totalRevenue: 0,
          totalAppointments: 0,
          appointmentsToday: 0,
          revenueToday: 0,
        },
        locations: [],
      });
    });

    it("should handle dao errors gracefully", async () => {
      locationDao.findAllForTenant.mockRejectedValue(new Error("Database error"));

      const req = mockReq();
      const res = mockRes();

      await crossLocationDashboardController.getCrossLocationDashboardHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Failed to load cross-location dashboard",
      });
    });
  });
});
