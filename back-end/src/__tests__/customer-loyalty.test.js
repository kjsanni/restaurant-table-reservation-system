const customerLoyaltyController = require("../controllers/customer-loyalty.controller");

jest.mock("../DAOs/reservation.dao");
jest.mock("../utils/featureFlags", () => ({
  requireFeatureFlag: jest.fn(() => Promise.resolve()),
}));

const reservationDAO = require("../DAOs/reservation.dao");
const { requireFeatureFlag } = require("../utils/featureFlags");

describe("Customer loyalty", () => {
  beforeEach(() => jest.clearAllMocks());

  it("getLoyaltyHandler returns loyalty data", async () => {
    const req = { user: { email: "alice@example.com", phone: "123" }, tenant: { id: 1 } };
    const res = { status: jest.fn(() => res), json: jest.fn() };
    reservationDAO.findOrCreateCustomer.mockResolvedValue({ id: 1 });
    reservationDAO.getCustomerById.mockResolvedValue({ id: 1, points: 250, visitCount: 5, lastVisitDate: "2026-07-28T00:00:00.000Z" });

    await customerLoyaltyController.getLoyaltyHandler(req, res);
    expect(reservationDAO.getCustomerById).toHaveBeenCalledWith(1, 1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      loyalty: {
        points: 250,
        visitCount: 5,
        lastVisitDate: "2026-07-28T00:00:00.000Z",
        tier: "Silver",
      },
    });
  });

  it("getLoyaltyHandler assigns Gold tier for 500+ points", async () => {
    const req = { user: { email: "alice@example.com", phone: "123" }, tenant: { id: 1 } };
    const res = { status: jest.fn(() => res), json: jest.fn() };
    reservationDAO.findOrCreateCustomer.mockResolvedValue({ id: 1 });
    reservationDAO.getCustomerById.mockResolvedValue({ id: 1, points: 600, visitCount: 10, lastVisitDate: null });

    await customerLoyaltyController.getLoyaltyHandler(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        loyalty: expect.objectContaining({ tier: "Gold" }),
      })
    );
  });

  it("redeemPointsHandler redeems points", async () => {
    const req = {
      user: { email: "alice@example.com", phone: "123" },
      tenant: { id: 1 },
      body: { points: 50 },
    };
    const res = { status: jest.fn(() => res), json: jest.fn() };
    reservationDAO.findOrCreateCustomer.mockResolvedValue({ id: 1 });
    reservationDAO.redeemCustomerPoints.mockResolvedValue({ id: 1, points: 150 });

    await customerLoyaltyController.redeemPointsHandler(req, res);
    expect(reservationDAO.redeemCustomerPoints).toHaveBeenCalledWith(1, 50, 1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("redeemPointsHandler rejects invalid points", async () => {
    const req = {
      user: { email: "alice@example.com", phone: "123" },
      tenant: { id: 1 },
      body: { points: -10 },
    };
    const res = { status: jest.fn(() => res), json: jest.fn() };
    reservationDAO.findOrCreateCustomer.mockResolvedValue({ id: 1 });

    await customerLoyaltyController.redeemPointsHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(reservationDAO.redeemCustomerPoints).not.toHaveBeenCalled();
  });

  it("redeemPointsHandler returns 404 when customer missing", async () => {
    const req = {
      user: { email: "alice@example.com", phone: "123" },
      tenant: { id: 1 },
      body: { points: 10 },
    };
    const res = { status: jest.fn(() => res), json: jest.fn() };
    reservationDAO.findOrCreateCustomer.mockResolvedValue(null);

    await customerLoyaltyController.redeemPointsHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
