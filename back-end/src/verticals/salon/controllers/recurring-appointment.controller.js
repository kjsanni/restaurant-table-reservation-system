"use strict";
const recurringAppointmentDao = require("../DAOs/recurringAppointment.dao");
const appointmentDao = require("../DAOs/appointment.dao");

const createRecurringAppointmentHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const payload = req.body;

    const existing = await recurringAppointmentDao.create({
      tenantId,
      customerId: payload.customerId,
      serviceId: payload.serviceId,
      stylistId: payload.stylistId || null,
      stationId: payload.stationId || null,
      frequency: payload.frequency,
      interval: payload.interval || 1,
      startDate: payload.startDate,
      endDate: payload.endDate || null,
      timeOfDay: payload.timeOfDay,
      durationMinutes: payload.durationMinutes,
      active: payload.active !== false,
    });

    return res.status(201).json({ success: true, recurringAppointment: existing });
  } catch (err) {
    console.error("createRecurringAppointmentHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to create recurring appointment" });
  }
};

const getRecurringAppointmentsHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const result = await recurringAppointmentDao.findAllForTenant(tenantId, req.query);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error("getRecurringAppointmentsHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to load recurring appointments" });
  }
};

const updateRecurringAppointmentHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { id } = req.params;
    const updated = await recurringAppointmentDao.update(id, tenantId, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Recurring appointment not found" });
    }
    return res.status(200).json({ success: true, recurringAppointment: updated });
  } catch (err) {
    console.error("updateRecurringAppointmentHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to update recurring appointment" });
  }
};

module.exports = {
  createRecurringAppointmentHandler,
  getRecurringAppointmentsHandler,
  updateRecurringAppointmentHandler,
};
