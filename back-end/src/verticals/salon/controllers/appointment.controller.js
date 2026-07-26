"use strict";
const salonModels = require("../models");
const appointmentDao = require("../DAOs/appointment.dao");
const staffServiceSkillDao = require("../DAOs/staffServiceSkill.dao");
const { logAction } = require("../../../middleware/auditLog");
const { enqueueSalonAppointmentReminders, sendSalonConfirmation, sendSalonCancellation } = require("../../../services/notification.service");

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
