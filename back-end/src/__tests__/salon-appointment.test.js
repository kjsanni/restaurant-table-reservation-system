"use strict";

jest.mock("../verticals/salon/DAOs/appointment.dao");
jest.mock("../middleware/auditLog", () => ({ logAction: jest.fn() }));
jest.mock("../tenant-platform/services/paystack.service", () => ({
  refundPayment: jest.fn().mockResolvedValue({ reference: "refund-456" }),
}));
jest.mock("../verticals/salon/services/appointmentScheduling.service", () => ({
  createCommissionForAppointment: jest.fn().mockResolvedValue({ id: 1 }),
}));

const appointmentController = require("../verticals/salon/controllers/appointment.controller");
const appointmentDao = require("../verticals/salon/DAOs/appointment.dao");
const appointmentSchedulingService = require("../verticals/salon/services/appointmentScheduling.service");

describe("appointment.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeRes() {
    const json = jest.fn();
    const status = jest.fn(function () { return { json: json }; });
    return { res: { status: status, json: json }, expectJson: function (expected) {
      expect(json).toHaveBeenCalledWith(expected);
    } };
  }

  it("getAllAppointments passes tenantId to DAO and returns data", async () => {
    require("../verticals/salon/DAOs/appointment.dao").findAllForTenant.mockResolvedValue({
      total: 2,
      data: [{ id: 1 }, { id: 2 }],
    });

    var ref = makeRes();
    var req = { tenant: { id: 1 }, query: {} };

    await appointmentController.getAllAppointments(req, ref.res);

    expect(require("../verticals/salon/DAOs/appointment.dao").findAllForTenant).toHaveBeenCalledWith(1, {});
    ref.expectJson({ success: true, total: 2, data: [{ id: 1 }, { id: 2 }] });
  });

  it("createAppointment returns 201 and logs audit entry", async () => {
    require("../verticals/salon/DAOs/appointment.dao").create.mockResolvedValue({
      id: 1,
      customerId: 5,
      serviceId: 2,
      start: "2026-07-22T10:00:00.000Z",
    });

    var ref = makeRes();
    var req = {
      tenant: { id: 1 },
      body: { customerId: 5, serviceId: 2, start: "2026-07-22T10:00:00.000Z" },
    };

    await appointmentController.createAppointment(req, ref.res);

    expect(ref.res.status).toHaveBeenCalledWith(201);
    ref.expectJson({
      success: true,
      data: { id: 1, customerId: 5, serviceId: 2, start: "2026-07-22T10:00:00.000Z" },
    });
  });

  it("getAppointment returns 404 json when DAO returns null", async () => {
    require("../verticals/salon/DAOs/appointment.dao").findById.mockResolvedValue(null);

    var ref = makeRes();
    var req = { tenant: { id: 1 }, params: { id: 999 } };

    await appointmentController.getAppointment(req, ref.res);

    expect(ref.res.status).toHaveBeenCalledWith(404);
    ref.expectJson({ success: false, message: "Appointment not found" });
  });

  it("getAllAppointments filters by source=walkin", async () => {
    require("../verticals/salon/DAOs/appointment.dao").findAllForTenant.mockResolvedValue({
      total: 1,
      data: [{ id: 10, source: "walkin" }],
    });

    var ref = makeRes();
    var req = { tenant: { id: 1 }, query: { source: "walkin" } };

    await appointmentController.getAllAppointments(req, ref.res);

    expect(require("../verticals/salon/DAOs/appointment.dao").findAllForTenant).toHaveBeenCalledWith(1, { source: "walkin" });
    ref.expectJson({ success: true, total: 1, data: [{ id: 10, source: "walkin" }] });
  });

  it("createAppointment accepts walkin source", async () => {
    require("../verticals/salon/DAOs/appointment.dao").create.mockResolvedValue({
      id: 11,
      source: "walkin",
      status: "pending",
    });

    var ref = makeRes();
    var req = {
      tenant: { id: 1 },
      body: { customerId: 1, serviceId: 2, start: "2026-07-22T10:00:00.000Z", source: "walkin", status: "pending" },
    };

    await appointmentController.createAppointment(req, ref.res);

    expect(ref.res.status).toHaveBeenCalledWith(201);
    ref.expectJson({
      success: true,
      data: { id: 11, source: "walkin", status: "pending" },
    });
  });

  it("refundAppointment returns 404 when appointment missing", async () => {
    require("../verticals/salon/DAOs/appointment.dao").findById.mockResolvedValue(null);

    var ref = makeRes();
    var req = { tenant: { id: 1 }, params: { id: 999 } };

    await appointmentController.refundAppointment(req, ref.res);

    expect(ref.res.status).toHaveBeenCalledWith(404);
    ref.expectJson({ success: false, message: "Appointment not found" });
  });

  it("refundAppointment returns 400 when appointment is unpaid", async () => {
    require("../verticals/salon/DAOs/appointment.dao").findById.mockResolvedValue({
      id: 1,
      paymentStatus: "unpaid",
      refundedAt: null,
    });

    var ref = makeRes();
    var req = { tenant: { id: 1 }, params: { id: 1 } };

    await appointmentController.refundAppointment(req, ref.res);

    expect(ref.res.status).toHaveBeenCalledWith(400);
    ref.expectJson({ success: false, message: "Only paid or partially paid appointments can be refunded" });
  });

  it("refundAppointment returns 400 when already refunded", async () => {
    require("../verticals/salon/DAOs/appointment.dao").findById.mockResolvedValue({
      id: 1,
      paymentStatus: "paid",
      refundedAt: new Date(),
    });

    var ref = makeRes();
    var req = { tenant: { id: 1 }, params: { id: 1 } };

    await appointmentController.refundAppointment(req, ref.res);

    expect(ref.res.status).toHaveBeenCalledWith(400);
    ref.expectJson({ success: false, message: "Appointment has already been refunded" });
  });

  it("refundAppointment calls Paystack refund and updates appointment", async () => {
    appointmentDao.findById.mockResolvedValue({
      id: 1,
      paymentStatus: "paid",
      paymentReference: "ref-123",
      refundedAt: null,
    });
    appointmentDao.update.mockResolvedValue({ id: 1, paymentStatus: "unpaid" });

    var ref = makeRes();
    var req = { tenant: { id: 1, locale: "en" }, params: { id: 1 }, app: { get: () => null } };

    await appointmentController.refundAppointment(req, ref.res);

    const { refundPayment } = require("../tenant-platform/services/paystack.service");
    expect(refundPayment).toHaveBeenCalledWith("ref-123");
    ref.expectJson({ success: true, message: "Refund processed successfully for appointment #1" });
  });

  it("updateAppointment auto-creates commission when status changes to completed", async () => {
    appointmentDao.findById.mockResolvedValue({ id: 1, status: "confirmed", serviceId: 2, stylistId: 3, tenantId: 1 });
    appointmentDao.update.mockResolvedValue({ id: 1, status: "completed", serviceId: 2, stylistId: 3, tenantId: 1 });
    appointmentSchedulingService.createCommissionForAppointment.mockResolvedValue({ id: 1, amount: 10 });

    const ref = makeRes();
    const req = { tenant: { id: 1 }, body: { customerId: 1, serviceId: 2, start: "2026-08-01T10:00:00.000Z", status: "completed" }, params: { id: 1 } };

    await appointmentController.updateAppointment(req, ref.res);

    expect(appointmentSchedulingService.createCommissionForAppointment).toHaveBeenCalledWith({
      id: 1,
      status: "completed",
      serviceId: 2,
      stylistId: 3,
      tenantId: 1,
    });
    ref.expectJson({ success: true, data: { id: 1, status: "completed", serviceId: 2, stylistId: 3, tenantId: 1 } });
  });

  it("updateAppointment still calls commission service when commissions are disabled (service returns null)", async () => {
    appointmentDao.findById.mockResolvedValue({ id: 1, status: "confirmed", serviceId: 2, stylistId: 3, tenantId: 1 });
    appointmentDao.update.mockResolvedValue({ id: 1, status: "completed", serviceId: 2, stylistId: 3, tenantId: 1 });
    appointmentSchedulingService.createCommissionForAppointment.mockResolvedValue(null);

    const ref = makeRes();
    const req = { tenant: { id: 1 }, body: { customerId: 1, serviceId: 2, start: "2026-08-01T10:00:00.000Z", status: "completed" }, params: { id: 1 } };

    await appointmentController.updateAppointment(req, ref.res);

    expect(appointmentSchedulingService.createCommissionForAppointment).toHaveBeenCalledWith({
      id: 1,
      status: "completed",
      serviceId: 2,
      stylistId: 3,
      tenantId: 1,
    });
  });

  it("updateAppointment does not create commission when status is not completed", async () => {
    appointmentDao.findById.mockResolvedValue({ id: 1, status: "confirmed", serviceId: 2, stylistId: 3, tenantId: 1 });
    appointmentDao.update.mockResolvedValue({ id: 1, status: "confirmed", serviceId: 2, stylistId: 3, tenantId: 1 });

    const ref = makeRes();
    const req = { tenant: { id: 1 }, body: { customerId: 1, serviceId: 2, start: "2026-08-01T10:00:00.000Z", status: "confirmed" }, params: { id: 1 } };

    await appointmentController.updateAppointment(req, ref.res);

    expect(appointmentSchedulingService.createCommissionForAppointment).not.toHaveBeenCalled();
  });
});
