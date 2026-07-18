const customerPortalController = require("../controllers/customer-portal.controller");

jest.mock("../DAOs/reservation.dao");

const reservationDAO = require("../DAOs/reservation.dao");

describe("Customer portal", () => {
  beforeEach(() => jest.clearAllMocks());

  it("getCustomerProfileHandler returns customer profile", async () => {
    const req = { user: { email: "alice@example.com", phone: "123" }, tenant: { id: 1 } };
    const res = { status: jest.fn(() => res), json: jest.fn() };
    reservationDAO.findOrCreateCustomer.mockResolvedValue({ id: 1, name: "Alice" });

    await customerPortalController.getCustomerProfileHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, customer: { id: 1, name: "Alice" } });
  });

  it("updateCustomerProfileHandler updates customer", async () => {
    const req = { user: { email: "alice@example.com", phone: "123" }, tenant: { id: 1 }, body: { name: "Alice Updated" } };
    const res = { status: jest.fn(() => res), json: jest.fn() };
    reservationDAO.findOrCreateCustomer.mockResolvedValue({ id: 1 });
    reservationDAO.updateCustomer.mockResolvedValue({ id: 1, name: "Alice Updated" });

    await customerPortalController.updateCustomerProfileHandler(req, res);
    expect(reservationDAO.updateCustomer).toHaveBeenCalledWith(1, { name: "Alice Updated" }, 1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("getCustomerReservationsHandler returns customer reservations", async () => {
    const req = { user: { email: "alice@example.com", phone: "123" }, tenant: { id: 1 } };
    const res = { status: jest.fn(() => res), json: jest.fn() };
    reservationDAO.findOrCreateCustomer.mockResolvedValue({ id: 1 });
    reservationDAO.findAllReservationsRaw.mockResolvedValue([{ id: 1, resStatus: "confirmed" }]);

    await customerPortalController.getCustomerReservationsHandler(req, res);
    expect(reservationDAO.findAllReservationsRaw).toHaveBeenCalledWith({ customerId: 1 }, 1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("cancelReservationHandler cancels reservation", async () => {
    const req = { params: { reservationId: 1 }, tenant: { id: 1 } };
    const res = { status: jest.fn(() => res), json: jest.fn() };
    reservationDAO.findReservationById.mockResolvedValue({ id: 1, resStatus: "confirmed" });
    reservationDAO.updateReservation.mockResolvedValue({ id: 1, resStatus: "cancelled" });

    await customerPortalController.cancelReservationHandler(req, res);
    expect(reservationDAO.updateReservation).toHaveBeenCalledWith(1, { resStatus: "cancelled" }, 1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("cancelReservationHandler returns 404 for missing reservation", async () => {
    const req = { params: { reservationId: 999 }, tenant: { id: 1 } };
    const res = { status: jest.fn(() => res), json: jest.fn() };
    reservationDAO.findReservationById.mockResolvedValue(null);

    await customerPortalController.cancelReservationHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
