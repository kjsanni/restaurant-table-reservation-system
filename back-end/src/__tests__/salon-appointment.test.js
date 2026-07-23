"use strict";

jest.mock("../verticals/salon/DAOs/appointment.dao");
jest.mock("../middleware/auditLog", () => ({ logAction: jest.fn() }));

const appointmentController = require("../verticals/salon/controllers/appointment.controller");

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
      body: { serviceId: 2, start: "2026-07-22T10:00:00.000Z", source: "walkin", status: "pending" },
    };

    await appointmentController.createAppointment(req, ref.res);

    expect(ref.res.status).toHaveBeenCalledWith(201);
    ref.expectJson({
      success: true,
      data: { id: 11, source: "walkin", status: "pending" },
    });
  });
});
