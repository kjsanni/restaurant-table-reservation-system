const salonReportsController = require("../controllers/salon-reports.controller");
const appointmentDao = require("../verticals/salon/DAOs/appointment.dao");

jest.mock("../verticals/salon/DAOs/appointment.dao");

describe("salon-reports.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const buildReq = (overrides = {}) => ({
    tenant: { id: 1 },
    query: {},
    ...overrides,
  });

  it("returns aggregated reports", async () => {
    appointmentDao.getRevenueByService.mockResolvedValue([
      { serviceId: 1, serviceName: "Haircut", servicePrice: 50, appointmentCount: 10, revenue: 500 },
    ]);
    appointmentDao.getTopStylists.mockResolvedValue([
      { stylistId: 1, stylistName: "Jane", stylistEmail: "jane@test.com", appointmentCount: 5, revenue: 250 },
    ]);
    appointmentDao.getAppointmentsBySource.mockResolvedValue([
      { source: "walkin", appointmentCount: 3, totalMinutes: 90 },
    ]);

    const req = buildReq();
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

    await salonReportsController.getSalonReportsHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      summary: {
        totalRevenue: 500,
        totalAppointments: 3,
        dateRange: { from: null, to: null },
      },
      revenueByService: [{ serviceId: 1, serviceName: "Haircut", servicePrice: 50, appointmentCount: 10, revenue: 500 }],
      topStylists: [{ stylistId: 1, stylistName: "Jane", stylistEmail: "jane@test.com", appointmentCount: 5, revenue: 250 }],
      appointmentsBySource: [{ source: "walkin", appointmentCount: 3, totalMinutes: 90 }],
    });
  });

  it("passes date filters to DAO queries", async () => {
    appointmentDao.getRevenueByService.mockResolvedValue([]);
    appointmentDao.getTopStylists.mockResolvedValue([]);
    appointmentDao.getAppointmentsBySource.mockResolvedValue([]);

    const req = buildReq({ query: { from: "2026-01-01", to: "2026-01-31" } });
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

    await salonReportsController.getSalonReportsHandler(req, res);

    expect(appointmentDao.getRevenueByService).toHaveBeenCalledWith(1, "2026-01-01", "2026-01-31");
    expect(appointmentDao.getTopStylists).toHaveBeenCalledWith(1, "2026-01-01", "2026-01-31");
    expect(appointmentDao.getAppointmentsBySource).toHaveBeenCalledWith(1, "2026-01-01", "2026-01-31");
  });
});
