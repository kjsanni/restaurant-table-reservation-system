const db = require("../db/models");
const advancedAnalyticsController = require("../tenant-platform/controllers/advancedAnalytics.controller");

jest.mock("../db/models", () => ({
  tenant: { count: jest.fn(), findAll: jest.fn() },
  payment: { findAll: jest.fn(), count: jest.fn() },
  reservation: { count: jest.fn(), findAll: jest.fn() },
  user: { count: jest.fn() },
  Sequelize: { Op: {} },
}));

describe("advancedAnalytics.controller", () => {
  let req;
  let res;

  beforeEach(() => {
    req = { query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it("getTenantGrowthMetricsHandler returns summary", async () => {
    db.tenant.count.mockResolvedValueOnce(10);
    db.tenant.findAll.mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    await advancedAnalyticsController.getTenantGrowthMetricsHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0]).toMatchObject({ success: true });
  });

  it("getChurnAnalysisHandler returns churn data", async () => {
    db.tenant.findAll.mockResolvedValue([]);
    await advancedAnalyticsController.getChurnAnalysisHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0]).toMatchObject({ success: true, totalChurned: 0 });
  });

  it("getLtvCacHandler returns LTV data", async () => {
    db.tenant.findAll.mockResolvedValue([
      { id: 1, name: "T1", plan: "starter", monthlyRevenue: 100, createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    ]);
    await advancedAnalyticsController.getLtvCacHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0]).toMatchObject({ success: true });
  });

  it("getRevenueAnalyticsHandler returns revenue data", async () => {
    db.payment.findAll.mockResolvedValue([
      { id: 1, tenantId: 1, amount: "50.00", currency: "GHS", status: "completed", method: "mobile_money", createdAt: new Date() },
      { id: 2, tenantId: 1, amount: "30.00", currency: "GHS", status: "failed", method: "card", createdAt: new Date() },
    ]);
    await advancedAnalyticsController.getRevenueAnalyticsHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0];
    expect(data.success).toBe(true);
    expect(data.summary.totalRevenue).toBe(50);
  });

  it("getBookingAnalyticsHandler returns booking data", async () => {
    db.reservation.count.mockResolvedValueOnce(5);
    db.reservation.findAll.mockResolvedValue([
      { id: 1, tenantId: 1, partySize: 4, status: "confirmed", createdAt: new Date() },
      { id: 2, tenantId: 1, partySize: 2, status: "cancelled", createdAt: new Date() },
    ]);
    await advancedAnalyticsController.getBookingAnalyticsHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0];
    expect(data.success).toBe(true);
    expect(data.summary.totalBookings).toBe(2);
  });

  it("getPaymentAnalyticsHandler returns payment analytics", async () => {
    db.payment.findAll.mockResolvedValue([
      { id: 1, tenantId: 1, amount: "50.00", currency: "GHS", status: "completed", method: "mobile_money", createdAt: new Date() },
      { id: 2, tenantId: 2, amount: "30.00", currency: "GHS", status: "completed", method: "card", createdAt: new Date() },
      { id: 3, tenantId: 1, amount: "20.00", currency: "GHS", status: "failed", method: "mobile_money", createdAt: new Date() },
    ]);
    await advancedAnalyticsController.getPaymentAnalyticsHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0];
    expect(data.success).toBe(true);
    expect(data.summary.failedPayments).toBe(1);
    expect(data.summary.byPaymentMethod).toBeDefined();
  });

  it("getUsageAnalyticsHandler returns usage data", async () => {
    db.tenant.count = jest.fn().mockResolvedValue(5);
    db.reservation.count = jest.fn().mockResolvedValue(20);
    db.user.count = jest.fn().mockResolvedValue(15);
    await advancedAnalyticsController.getUsageAnalyticsHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0];
    expect(data.success).toBe(true);
    expect(data.summary.dailyActiveTenants).toBe(5);
    expect(data.summary.totalReservations).toBe(20);
    expect(data.summary.activeUsers).toBe(15);
  });
});
