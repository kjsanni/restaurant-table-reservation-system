const reservationDAO = require("../DAOs/reservation.dao");
const appointmentDao = require("../verticals/salon/DAOs/appointment.dao");
const customerPortalController = require("../controllers/customer-portal.controller");
const salonCustomerPortalController = require("../controllers/salon-customer-portal.controller");

jest.mock("../DAOs/reservation.dao");
jest.mock("../verticals/salon/DAOs/appointment.dao");
jest.mock("../DAOs/payment.dao");
jest.mock("../DAOs/refund.dao");
jest.mock("../tenant-platform/DAOs/platformAudit.dao");

const buildReq = (overrides = {}) => ({
  user: {
    id: 1,
    email: "customer@test.com",
    username: "Test Customer",
    phone: "+233000000000",
  },
  tenant: { id: 10 },
  params: {},
  ip: "127.0.0.1",
  ...overrides,
});

const buildRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

describe("customer-portal ownership", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("cancelReservationHandler", () => {
    it("allows customer to cancel their own reservation", async () => {
      reservationDAO.findReservationById.mockResolvedValue({
        id: 1,
        tenantId: 10,
        customerId: 99,
        resStatus: "confirmed",
      });
      reservationDAO.findOrCreateCustomer.mockResolvedValue({
        id: 99,
        email: "customer@test.com",
      });

      const req = buildReq({ params: { reservationId: "1" } });
      const res = buildRes();
      await customerPortalController.cancelReservationHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(reservationDAO.updateReservation).toHaveBeenCalledWith("1", { resStatus: "cancelled" }, 10);
    });

    it("denies customer from cancelling another customer's reservation", async () => {
      reservationDAO.findReservationById.mockResolvedValue({
        id: 1,
        tenantId: 10,
        customerId: 100,
        resStatus: "confirmed",
      });
      reservationDAO.findOrCreateCustomer.mockResolvedValue({
        id: 99,
        email: "customer@test.com",
      });

      const req = buildReq({ params: { reservationId: "1" } });
      const res = buildRes();
      await customerPortalController.cancelReservationHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Not authorized for this reservation",
      });
      expect(reservationDAO.updateReservation).not.toHaveBeenCalled();
    });
  });
});

describe("salon-customer-portal ownership", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("cancelSalonAppointmentHandler", () => {
    it("allows customer to cancel their own appointment", async () => {
      appointmentDao.findById.mockResolvedValue({
        id: 1,
        tenantId: 10,
        customerId: 99,
        status: "confirmed",
      });
      reservationDAO.findOrCreateCustomer.mockResolvedValue({
        id: 99,
        email: "customer@test.com",
      });

      const req = buildReq({ params: { appointmentId: "1" } });
      const res = buildRes();
      await salonCustomerPortalController.cancelSalonAppointmentHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(appointmentDao.update).toHaveBeenCalledWith("1", 10, { status: "cancelled" });
    });

    it("denies customer from cancelling another customer's appointment", async () => {
      appointmentDao.findById.mockResolvedValue({
        id: 1,
        tenantId: 10,
        customerId: 100,
        status: "confirmed",
      });
      reservationDAO.findOrCreateCustomer.mockResolvedValue({
        id: 99,
        email: "customer@test.com",
      });

      const req = buildReq({ params: { appointmentId: "1" } });
      const res = buildRes();
      await salonCustomerPortalController.cancelSalonAppointmentHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "You do not have permission to cancel this appointment",
      });
      expect(appointmentDao.update).not.toHaveBeenCalled();
    });

    it("allows tenant admin to cancel any appointment", async () => {
      appointmentDao.findById.mockResolvedValue({
        id: 1,
        tenantId: 10,
        customerId: 100,
        status: "confirmed",
      });
      reservationDAO.findOrCreateCustomer.mockResolvedValue({
        id: 99,
        email: "customer@test.com",
      });

      const req = buildReq({ user: { ...buildReq().user, role: "admin" }, params: { appointmentId: "1" } });
      const res = buildRes();
      await salonCustomerPortalController.cancelSalonAppointmentHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(appointmentDao.update).toHaveBeenCalledWith("1", 10, { status: "cancelled" });
    });

    it("denies tenant staff from cancelling another customer's appointment", async () => {
      appointmentDao.findById.mockResolvedValue({
        id: 1,
        tenantId: 10,
        customerId: 100,
        status: "confirmed",
      });
      reservationDAO.findOrCreateCustomer.mockResolvedValue({
        id: 99,
        email: "customer@test.com",
      });

      const req = buildReq({ user: { ...buildReq().user, role: "staff" }, params: { appointmentId: "1" } });
      const res = buildRes();
      await salonCustomerPortalController.cancelSalonAppointmentHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "You do not have permission to cancel this appointment",
      });
      expect(appointmentDao.update).not.toHaveBeenCalled();
    });
  });

  describe("rebookSalonAppointmentHandler", () => {
    it("allows customer to rebook their own appointment", async () => {
      appointmentDao.findById.mockResolvedValue({
        id: 1,
        tenantId: 10,
        customerId: 99,
        status: "completed",
        serviceId: 1,
        stylistId: 2,
        stationId: 3,
        durationMinutes: 30,
        bufferMinutes: 0,
      });
      reservationDAO.findOrCreateCustomer.mockResolvedValue({
        id: 99,
        email: "customer@test.com",
      });
      appointmentDao.create.mockResolvedValue({ id: 2 });

      const req = buildReq({ params: { appointmentId: "1" } });
      const res = buildRes();
      await salonCustomerPortalController.rebookSalonAppointmentHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(appointmentDao.create).toHaveBeenCalled();
    });

    it("denies customer from rebooking another customer's appointment", async () => {
      appointmentDao.findById.mockResolvedValue({
        id: 1,
        tenantId: 10,
        customerId: 100,
        status: "completed",
      });
      reservationDAO.findOrCreateCustomer.mockResolvedValue({
        id: 99,
        email: "customer@test.com",
      });

      const req = buildReq({ params: { appointmentId: "1" } });
      const res = buildRes();
      await salonCustomerPortalController.rebookSalonAppointmentHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "You do not have permission to rebook this appointment",
      });
      expect(appointmentDao.create).not.toHaveBeenCalled();
    });

    it("allows tenant admin to rebook any appointment", async () => {
      appointmentDao.findById.mockResolvedValue({
        id: 1,
        tenantId: 10,
        customerId: 100,
        status: "completed",
        serviceId: 1,
        stylistId: 2,
        stationId: 3,
        durationMinutes: 30,
        bufferMinutes: 0,
      });
      reservationDAO.findOrCreateCustomer.mockResolvedValue({
        id: 99,
        email: "customer@test.com",
      });
      appointmentDao.create.mockResolvedValue({ id: 2 });

      const req = buildReq({ user: { ...buildReq().user, role: "admin" }, params: { appointmentId: "1" } });
      const res = buildRes();
      await salonCustomerPortalController.rebookSalonAppointmentHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(appointmentDao.create).toHaveBeenCalled();
    });

    it("denies tenant staff from rebooking another customer's appointment", async () => {
      appointmentDao.findById.mockResolvedValue({
        id: 1,
        tenantId: 10,
        customerId: 100,
        status: "completed",
      });
      reservationDAO.findOrCreateCustomer.mockResolvedValue({
        id: 99,
        email: "customer@test.com",
      });

      const req = buildReq({ user: { ...buildReq().user, role: "staff" }, params: { appointmentId: "1" } });
      const res = buildRes();
      await salonCustomerPortalController.rebookSalonAppointmentHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "You do not have permission to rebook this appointment",
      });
      expect(appointmentDao.create).not.toHaveBeenCalled();
    });
  });
});
