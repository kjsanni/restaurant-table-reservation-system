jest.mock("../DAOs/reservation.dao", () => ({
  getCustomerById: jest.fn(),
  getCustomerReservationHistory: jest.fn(),
  getCustomerStats: jest.fn(),
}));

const reservationDAO = require("../DAOs/reservation.dao");
const customerController = require("../controllers/customer.controller");

describe("customer.controller — profile", () => {
  let req;
  let res;

  beforeEach(() => {
    req = { params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it("should return 404 when customer not found", async () => {
    req.params.customerId = 999;
    reservationDAO.getCustomerById.mockResolvedValue(null);

    await customerController.getCustomerProfileHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Customer not found",
    });
  });

  it("should return 200 with profile data for valid customer", async () => {
    req.params.customerId = 1;
    reservationDAO.getCustomerById.mockResolvedValue({
      id: 1,
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
    });
    reservationDAO.getCustomerReservationHistory.mockResolvedValue([
      { id: 1, resDate: "2026-06-29", resStatus: "pending" },
    ]);
    reservationDAO.getCustomerStats.mockResolvedValue({
      totalVisits: 5,
      noShowCount: 1,
      noShowRate: 20,
      statusBreakdown: [],
    });

    await customerController.getCustomerProfileHandler(req, res);

    expect(reservationDAO.getCustomerById).toHaveBeenCalledWith(1, undefined);
    expect(reservationDAO.getCustomerReservationHistory).toHaveBeenCalledWith(1, 50, undefined);
    expect(reservationDAO.getCustomerStats).toHaveBeenCalledWith(1, undefined);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      profile: {
        customer: expect.any(Object),
        history: expect.any(Array),
        stats: expect.any(Object),
      },
    });
  });

  it("should call DAO with default limit of 50", async () => {
    req.params.customerId = 5;
    reservationDAO.getCustomerById.mockResolvedValue({ id: 5 });
    reservationDAO.getCustomerReservationHistory.mockResolvedValue([]);
    reservationDAO.getCustomerStats.mockResolvedValue({
      totalVisits: 0,
      noShowCount: 0,
      noShowRate: 0,
      statusBreakdown: [],
    });

    await customerController.getCustomerProfileHandler(req, res);

    expect(reservationDAO.getCustomerReservationHistory).toHaveBeenCalledWith(5, 50, undefined);
  });
});
