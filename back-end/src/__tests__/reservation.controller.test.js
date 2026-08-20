jest.mock("../DAOs/reservation.dao");
jest.mock("../DAOs/payment.dao");
jest.mock("../services/webhook.service");

const reservationController = require("../controllers/reservation.controller");

describe("reservation.controller — mass-assignment protection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("editHandler strips non-allowlisted fields from the request body", async () => {
    const reservationDAO = require("../DAOs/reservation.dao");
    reservationDAO.findReservationById.mockResolvedValue({ id: 1, resDate: "2026-08-21", resTime: "23:59:59", resStatus: "pending" });
    reservationDAO.updateReservation.mockResolvedValue(1);

    const req = {
      params: { reservationId: "1" },
      body: {
        resDate: "2026-08-21",
        resTime: "23:59:59",
        people: 4,
        notes: "near the window",
        tenantId: 999,
        customerId: 888,
        _v: 0,
        isSuperAdmin: true,
        malicious: "<script>alert(1)</script>",
      },
      tenant: { id: 1 },
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await reservationController.editHandler(req, res);

    expect(reservationDAO.updateReservation).toHaveBeenCalledTimes(1);
    const passedPayload = reservationDAO.updateReservation.mock.calls[0][1];
    expect(passedPayload.tenantId).toBeUndefined();
    expect(passedPayload.customerId).toBeUndefined();
    expect(passedPayload._v).toBeUndefined();
    expect(passedPayload.isSuperAdmin).toBeUndefined();
    expect(passedPayload.malicious).toBeUndefined();
    expect(passedPayload.resDate).toBe("2026-08-21");
    expect(passedPayload.people).toBe(4);
  });
});

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
