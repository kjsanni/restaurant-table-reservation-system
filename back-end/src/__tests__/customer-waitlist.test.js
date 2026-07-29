const customerWaitlistController = require("../controllers/customer-waitlist.controller");

jest.mock("../DAOs/reservation.dao");
jest.mock("../DAOs/waitlist.dao");

const reservationDAO = require("../DAOs/reservation.dao");
const waitlistDAO = require("../DAOs/waitlist.dao");

describe("Customer waitlist", () => {
  beforeEach(() => jest.clearAllMocks());

  it("getCustomerWaitlistHandler returns customer waitlist entries", async () => {
    const req = { user: { email: "alice@example.com", phone: "123" }, tenant: { id: 1 } };
    const res = { status: jest.fn(() => res), json: jest.fn() };
    reservationDAO.findOrCreateCustomer.mockResolvedValue({ id: 1 });
    waitlistDAO.getWaitingList.mockResolvedValue([{ id: 1, status: "waiting" }]);

    await customerWaitlistController.getCustomerWaitlistHandler(req, res);
    expect(waitlistDAO.getWaitingList).toHaveBeenCalledWith({ customerId: 1 }, 1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, entries: [{ id: 1, status: "waiting" }] });
  });

  it("getCustomerWaitlistHandler returns empty when customer profile missing", async () => {
    const req = { user: { email: "alice@example.com", phone: "123" }, tenant: { id: 1 } };
    const res = { status: jest.fn(() => res), json: jest.fn() };
    reservationDAO.findOrCreateCustomer.mockResolvedValue(null);

    await customerWaitlistController.getCustomerWaitlistHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, entries: [] });
  });

  it("joinWaitlistHandler creates waitlist entry", async () => {
    const req = {
      user: { email: "alice@example.com", phone: "123" },
      tenant: { id: 1 },
      body: { partySize: 4, desiredTime: "2026-07-28T20:00:00.000Z", notes: "Window seat" },
    };
    const res = { status: jest.fn(() => res), json: jest.fn() };
    reservationDAO.findOrCreateCustomer.mockResolvedValue({ id: 1, firstName: "Alice", lastName: "Smith", phone: "123", email: "alice@example.com" });
    waitlistDAO.createEntry.mockResolvedValue({ id: 1, status: "waiting" });

    await customerWaitlistController.joinWaitlistHandler(req, res);
    expect(waitlistDAO.createEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Alice Smith",
        partySize: 4,
        customerId: 1,
        status: "waiting",
      }),
      1
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("cancelWaitlistEntryHandler cancels entry", async () => {
    const req = {
      user: { email: "alice@example.com", phone: "123" },
      tenant: { id: 1 },
      params: { id: 1 },
    };
    const res = { status: jest.fn(() => res), json: jest.fn() };
    reservationDAO.findOrCreateCustomer.mockResolvedValue({ id: 1 });
    waitlistDAO.findById.mockResolvedValue({ id: 1, customerId: 1 });
    waitlistDAO.markCancelled.mockResolvedValue({ id: 1, status: "cancelled" });

    await customerWaitlistController.cancelWaitlistEntryHandler(req, res);
    expect(waitlistDAO.markCancelled).toHaveBeenCalledWith(1, 1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("cancelWaitlistEntryHandler rejects unauthorized entry", async () => {
    const req = {
      user: { email: "alice@example.com", phone: "123" },
      tenant: { id: 1 },
      params: { id: 1 },
    };
    const res = { status: jest.fn(() => res), json: jest.fn() };
    reservationDAO.findOrCreateCustomer.mockResolvedValue({ id: 1 });
    waitlistDAO.findById.mockResolvedValue({ id: 1, customerId: 99 });

    await customerWaitlistController.cancelWaitlistEntryHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
