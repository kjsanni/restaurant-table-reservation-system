jest.mock("../DAOs/reservation.dao");
jest.mock("../DAOs/payment.dao");

const reservationController = require("../controllers/reservation.controller");

describe("reservation.controller — pagination", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getAllHandler should return paginated response when page/pageSize provided", async () => {
    const mockReservations = [{ id: 1 }, { id: 2 }];
    const mockTotal = 10;

    require("../DAOs/reservation.dao").findAllReservations.mockResolvedValue({
      reservations: mockReservations,
      total: mockTotal,
    });

    const req = {
      query: { page: "1", pageSize: "2" },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await reservationController.getAllHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      collection: mockReservations,
      total: mockTotal,
      page: 1,
      pageSize: 2,
    });
  });

  it("getAllHandler should return legacy response when no pagination", async () => {
    const mockReservations = [{ id: 1 }, { id: 2 }];

    require("../DAOs/reservation.dao").findAllReservations.mockResolvedValue(mockReservations);

    const req = {
      query: {},
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await reservationController.getAllHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      collection: mockReservations,
    });
  });
});
