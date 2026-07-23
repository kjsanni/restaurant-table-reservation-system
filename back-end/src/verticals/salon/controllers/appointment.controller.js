"use strict";
const salonModels = require("../models");
const appointmentDao = require("../DAOs/appointment.dao");
const staffServiceSkillDao = require("../DAOs/staffServiceSkill.dao");
const { logAction } = require("../../../middleware/auditLog");
const { enqueueSalonAppointmentReminders } = require("../../../services/notification.service");

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
        enqueueSalonAppointmentReminders(tenantId).catch(() => {});
      }

      res.status(201).json({ success: true, data: appointment });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async updateAppointment(req, res) {
    try {
      const tenantId = req.tenant?.id;
      const appointment = await appointmentDao.update(req.params.id, tenantId, req.body);
      if (!appointment) {
        return res.status(404).json({ success: false, message: "Appointment not found" });
      }

      await logAction(req, "appointment_updated", {
        appointmentId: appointment.id,
        changes: req.body,
      });

      res.json({ success: true, data: appointment });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async deleteAppointment(req, res) {
    try {
      const tenantId = req.tenant?.id;
      const deleted = await appointmentDao.delete(req.params.id, tenantId);
      if (!deleted) {
        return res.status(404).json({ success: false, message: "Appointment not found" });
      }
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
