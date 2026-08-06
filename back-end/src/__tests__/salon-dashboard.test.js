"use strict";

jest.mock("../verticals/salon/DAOs/appointment.dao");
jest.mock("../verticals/salon/DAOs/station.dao");

const salonDashboardController = require("../controllers/salon-dashboard.controller");
const { makeRes } = require("./utils/test-response");

describe("salon-dashboard.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when tenant is missing", async () => {
    const ref = makeRes();
    const req = { tenant: null };

    await salonDashboardController.getSalonDashboardHandler(req, ref.res);

    expect(ref.res.status).toHaveBeenCalledWith(400);
    ref.expectJson({ success: false, message: "Tenant context required" });
  });

  it("returns dashboard KPIs from DAOs", async () => {
    require("../verticals/salon/DAOs/appointment.dao").getTodayStats.mockResolvedValue({
      appointmentsToday: 5,
      clientsToday: 3,
      revenueToday: 1250,
    });
    require("../verticals/salon/DAOs/station.dao").getUtilization.mockResolvedValue({
      utilizationPercent: 72,
      occupiedCount: 8,
      totalCount: 11,
    });

    const ref = makeRes();
    const req = { tenant: { id: 1 } };

    await salonDashboardController.getSalonDashboardHandler(req, ref.res);

    expect(ref.res.status).toHaveBeenCalledWith(200);
    ref.expectJson({
      success: true,
      kpis: {
        appointmentsToday: 5,
        revenueToday: 1250,
        clientsToday: 3,
        chairUtilization: {
          percent: 72,
          occupied: 8,
          total: 11,
        },
      },
    });
  });
});
