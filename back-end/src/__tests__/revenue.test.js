jest.mock("../DAOs/payment.dao");

const reservationController = require("../controllers/reservation.controller");

describe("reservation.controller — revenue time series", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getRevenueTimeSeriesHandler should return 400 for invalid granularity", async () => {
    const req = { query: { granularity: "invalid" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await reservationController.getRevenueTimeSeriesHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid granularity. Use 'day', 'week', or 'month'.",
    });
  });

  it("getRevenueTimeSeriesHandler should return series data for valid request", async () => {
    const mockData = {
      series: [
        { periodLabel: "2026-07-01", total: 100, count: 2, byMethod: { cash: { total: 100, count: 2 } } },
      ],
      summary: { totalRevenue: 100, totalPayments: 2, avgPayment: 50 },
    };

    require("../DAOs/payment.dao").getRevenueTimeSeries.mockResolvedValue(mockData);

    const req = { query: { from: "2026-07-01", to: "2026-07-16", granularity: "day" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await reservationController.getRevenueTimeSeriesHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      ...mockData,
    });
  });
});
