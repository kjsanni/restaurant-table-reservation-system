const recurringAppointmentController = require("../verticals/salon/controllers/recurring-appointment.controller");
const recurringAppointmentDao = require("../verticals/salon/DAOs/recurringAppointment.dao");

jest.mock("../verticals/salon/DAOs/recurringAppointment.dao");

describe("recurring-appointment.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const buildReq = (overrides = {}) => ({
    tenant: { id: 1 },
    body: {},
    params: {},
    query: {},
    ...overrides,
  });

  describe("createRecurringAppointmentHandler", () => {
    it("creates a recurring appointment", async () => {
      recurringAppointmentDao.create.mockResolvedValue({ id: 1, frequency: "weekly" });
      const req = buildReq({ body: { customerId: 1, serviceId: 1, frequency: "weekly", startDate: "2026-01-01", timeOfDay: "10:00", durationMinutes: 60 } });
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

      await recurringAppointmentController.createRecurringAppointmentHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(recurringAppointmentDao.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 1,
          customerId: 1,
          serviceId: 1,
          frequency: "weekly",
        })
      );
    });
  });

  describe("getRecurringAppointmentsHandler", () => {
    it("returns paginated list", async () => {
      recurringAppointmentDao.findAllForTenant.mockResolvedValue({ total: 1, data: [{ id: 1 }] });
      const req = buildReq();
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

      await recurringAppointmentController.getRecurringAppointmentsHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, total: 1, data: [{ id: 1 }] });
    });
  });

  describe("updateRecurringAppointmentHandler", () => {
    it("updates existing recurring appointment", async () => {
      recurringAppointmentDao.update.mockResolvedValue({ id: 1, active: false });
      const req = buildReq({ params: { id: "1" }, body: { active: false } });
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

      await recurringAppointmentController.updateRecurringAppointmentHandler(req, res);

      expect(recurringAppointmentDao.update).toHaveBeenCalledWith("1", 1, { active: false });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 404 when not found", async () => {
      recurringAppointmentDao.update.mockResolvedValue(null);
      const req = buildReq({ params: { id: "999" }, body: { active: false } });
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

      await recurringAppointmentController.updateRecurringAppointmentHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
