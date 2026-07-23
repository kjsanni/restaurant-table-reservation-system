const salonCustomerPortalController = require("../controllers/salon-customer-portal.controller");
const reservationDAO = require("../DAOs/reservation.dao");
const appointmentDao = require("../verticals/salon/DAOs/appointment.dao");

jest.mock("../DAOs/reservation.dao");
jest.mock("../verticals/salon/DAOs/appointment.dao");

describe("salon-customer-portal.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const buildReq = (overrides = {}) => ({
    user: { email: "test@example.com", username: "Test User", phone: "+233241234567" },
    tenant: { id: 1 },
    params: {},
    ...overrides,
  });

  describe("getSalonCustomerProfileHandler", () => {
    it("returns 200 with customer profile when found", async () => {
      reservationDAO.findOrCreateCustomer.mockResolvedValue({ id: 1, email: "test@example.com" });
      const req = buildReq();
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

      await salonCustomerPortalController.getSalonCustomerProfileHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, customer: { id: 1, email: "test@example.com" } });
    });

    it("returns 404 when no customer profile exists", async () => {
      reservationDAO.findOrCreateCustomer.mockResolvedValue(null);
      const req = buildReq();
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

      await salonCustomerPortalController.getSalonCustomerProfileHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "No customer profile linked to this account" });
    });
  });

  describe("getSalonCustomerAppointmentsHandler", () => {
    it("returns 200 with appointments list", async () => {
      reservationDAO.findOrCreateCustomer.mockResolvedValue({ id: 1 });
      appointmentDao.findAllForTenant.mockResolvedValue({ data: [{ id: 1, status: "confirmed" }] });
      const req = buildReq();
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

      await salonCustomerPortalController.getSalonCustomerAppointmentsHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, appointments: [{ id: 1, status: "confirmed" }] });
    });

    it("returns empty appointments when customer not found", async () => {
      reservationDAO.findOrCreateCustomer.mockResolvedValue(null);
      const req = buildReq();
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

      await salonCustomerPortalController.getSalonCustomerAppointmentsHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, appointments: [] });
    });
  });

  describe("cancelSalonAppointmentHandler", () => {
    it("cancels appointment successfully", async () => {
      appointmentDao.findById.mockResolvedValue({ id: 1, status: "confirmed" });
      appointmentDao.update.mockResolvedValue({ id: 1, status: "cancelled" });
      const req = buildReq({ params: { appointmentId: "1" } });
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

      await salonCustomerPortalController.cancelSalonAppointmentHandler(req, res);

      expect(appointmentDao.update).toHaveBeenCalledWith("1", 1, { status: "cancelled" });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, appointment: { id: 1, status: "cancelled" } });
    });

    it("returns 404 when appointment not found", async () => {
      appointmentDao.findById.mockResolvedValue(null);
      const req = buildReq({ params: { appointmentId: "999" } });
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

      await salonCustomerPortalController.cancelSalonAppointmentHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "Appointment not found" });
    });

    it("returns 400 when appointment already cancelled", async () => {
      appointmentDao.findById.mockResolvedValue({ id: 1, status: "cancelled" });
      const req = buildReq({ params: { appointmentId: "1" } });
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

      await salonCustomerPortalController.cancelSalonAppointmentHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "Appointment cannot be cancelled" });
    });
  });
});
