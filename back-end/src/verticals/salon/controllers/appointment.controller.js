"use strict";
const salonModels = require("../models");
const appointmentDao = require("../DAOs/appointment.dao");
const staffServiceSkillDao = require("../DAOs/staffServiceSkill.dao");
const { logAction } = require("../../../middleware/auditLog");
const { enqueueSalonAppointmentReminders, sendSalonConfirmation, sendSalonCancellation } = require("../../../services/notification.service");

const validateAppointment = (data) => {
  const errors = [];
  if (!data.customerId || !Number.isInteger(data.customerId) || data.customerId <= 0) {
    errors.push("customerId must be a positive integer");
  }
  if (!data.serviceId || !Number.isInteger(data.serviceId) || data.serviceId <= 0) {
    errors.push("serviceId must be a positive integer");
  }
  if (!data.start) {
    errors.push("start is required");
  }
  if (data.durationMinutes !== undefined && (!Number.isInteger(data.durationMinutes) || data.durationMinutes < 5)) {
    errors.push("durationMinutes must be an integer >= 5");
  }
  if (data.bufferMinutes !== undefined && (!Number.isInteger(data.bufferMinutes) || data.bufferMinutes < 0)) {
    errors.push("bufferMinutes must be a non-negative integer");
  }
  if (data.status && !["pending", "confirmed", "in_progress", "completed", "cancelled", "no_show"].includes(data.status)) {
    errors.push("status must be one of pending, confirmed, in_progress, completed, cancelled, no_show");
  }
  if (data.paymentStatus && !["deposit", "partial", "paid", "unpaid"].includes(data.paymentStatus)) {
    errors.push("paymentStatus must be one of deposit, partial, paid, unpaid");
  }
  if (data.depositAmount !== undefined && (typeof data.depositAmount !== "number" || data.depositAmount < 0)) {
    errors.push("depositAmount must be a non-negative number");
  }
  if (data.source && !["web", "whatsapp", "phone", "walkin"].includes(data.source)) {
    errors.push("source must be one of web, whatsapp, phone, walkin");
  }
  return errors;
};

const emitSalonAppointmentEvent = (req, event, payload) => {
  try {
    const io = req.app?.get("io");
    if (!io) return;
    const room = `salon:appointments:${req.tenant?.id}`;
    io.to(room).emit(event, payload);
  } catch (err) {
    console.error("Failed to emit salon appointment event:", err.message);
  }
};

const appointmentController = {
  async getAllAppointments(req, res) {
    try {
      const tenantId = req.tenant?.id;
      const result = await appointmentDao.findAllForTenant(tenantId, req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getAppointment(req, res) {
    try {
      const tenantId = req.tenant?.id;
      const appointment = await appointmentDao.findById(req.params.id, tenantId);
      if (!appointment) {
        return res.status(404).json({ success: false, message: "Appointment not found" });
      }
      res.json({ success: true, data: appointment });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async createAppointment(req, res) {
    try {
      const tenantId = req.tenant?.id;
      const validationErrors = validateAppointment(req.body);
      if (validationErrors.length > 0) {
        return res.status(422).json({ success: false, message: "Validation failed", errors: validationErrors });
      }
      const data = { ...req.body, tenantId };
      const appointment = await appointmentDao.create(data);

      await logAction(req, "appointment_created", {
        appointmentId: appointment.id,
        customerId: appointment.customerId,
        serviceId: appointment.serviceId,
        start: appointment.start,
      });

      if (appointment.status === "confirmed") {
        sendSalonConfirmation(appointment, tenantId).catch(() => {});
        enqueueSalonAppointmentReminders(tenantId).catch(() => {});
      }

      emitSalonAppointmentEvent(req, "salon-appointment-created", appointment);

      res.status(201).json({ success: true, data: appointment });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async updateAppointment(req, res) {
    try {
      const tenantId = req.tenant?.id;
      const validationErrors = validateAppointment(req.body);
      if (validationErrors.length > 0) {
        return res.status(422).json({ success: false, message: "Validation failed", errors: validationErrors });
      }
      const allowed = ["status", "start", "durationMinutes", "end", "bufferMinutes", "notes", "paymentStatus", "depositAmount", "serviceId", "stylistId", "stationId"];
      const updates = {};
      for (const key of allowed) {
        if (Object.prototype.hasOwnProperty.call(req.body, key)) {
          updates[key] = req.body[key];
        }
      }
      const appointment = await appointmentDao.update(req.params.id, tenantId, updates);
      if (!appointment) {
        return res.status(404).json({ success: false, message: "Appointment not found" });
      }

      await logAction(req, "appointment_updated", {
        appointmentId: appointment.id,
        changes: updates,
      });

      emitSalonAppointmentEvent(req, "salon-appointment-updated", appointment);

      res.json({ success: true, data: appointment });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async deleteAppointment(req, res) {
    try {
      const tenantId = req.tenant?.id;
      const appointment = await appointmentDao.findById(req.params.id, tenantId);
      if (!appointment) {
        return res.status(404).json({ success: false, message: "Appointment not found" });
      }
      const deleted = await appointmentDao.delete(req.params.id, tenantId);
      if (!deleted) {
        return res.status(404).json({ success: false, message: "Appointment not found" });
      }
      await logAction(req, "appointment_deleted", {
        appointmentId: req.params.id,
        customerId: appointment.customerId,
        serviceId: appointment.serviceId,
      });
      if (appointment.status !== "cancelled" && appointment.status !== "no_show") {
        sendSalonCancellation(appointment, tenantId).catch(() => {});
      }
      emitSalonAppointmentEvent(req, "salon-appointment-deleted", { id: appointment.id });
      res.json({ success: true, message: "Appointment deleted" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async refundAppointment(req, res) {
    try {
      const tenantId = req.tenant?.id;
      const appointment = await appointmentDao.findById(req.params.id, tenantId);
      if (!appointment) {
        return res.status(404).json({ success: false, message: "Appointment not found" });
      }
      if (appointment.paymentStatus !== "paid" && appointment.paymentStatus !== "deposit" && appointment.paymentStatus !== "partial") {
        return res.status(400).json({ success: false, message: "Only paid or partially paid appointments can be refunded" });
      }
      if (appointment.refundedAt) {
        return res.status(400).json({ success: false, message: "Appointment has already been refunded" });
      }

      let refundResult = null;
      if (appointment.paymentReference) {
        try {
          const { refundPayment } = require("../../../tenant-platform/services/paystack.service");
          refundResult = await refundPayment(appointment.paymentReference);
        } catch (refundErr) {
          return res.status(502).json({ success: false, message: `Paystack refund failed: ${refundErr.message}` });
        }
      }

      const updated = await appointmentDao.update(req.params.id, tenantId, {
        paymentStatus: "unpaid",
        depositAmount: 0,
        refundedAt: new Date(),
      });
      if (!updated) {
        return res.status(404).json({ success: false, message: "Appointment not found" });
      }

      await logAction(req, "appointment_refunded", {
        appointmentId: appointment.id,
        customerId: appointment.customerId,
        previousPaymentStatus: appointment.paymentStatus,
        refundReference: refundResult?.reference || null,
      });

      emitSalonAppointmentEvent(req, "salon-appointment-refunded", updated);
      res.json({ success: true, data: updated });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getStylistsForService(req, res) {
    try {
      const tenantId = req.tenant?.id;
      const serviceId = Number(req.params.serviceId);
      const skills = await staffServiceSkillDao.findByService(serviceId, tenantId);
      const stylists = skills
        .map((skill) => ({
          id: skill.user?.id,
          username: skill.user?.username,
          email: skill.user?.email,
          skillLevel: skill.skillLevel,
        }))
        .filter((item) => item.id != null);
      res.json({ success: true, data: stylists });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = appointmentController;
