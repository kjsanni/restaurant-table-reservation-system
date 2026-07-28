"use strict";
const commissionDao = require("../DAOs/commission.dao");
const { logAction } = require("../../../middleware/auditLog");

const validateCommission = (data) => {
  const errors = [];
  if (!data.userId || !Number.isInteger(data.userId) || data.userId <= 0) {
    errors.push("userId must be a positive integer");
  }
  if (data.amount !== undefined && (typeof data.amount !== "number" || data.amount < 0)) {
    errors.push("amount must be a non-negative number");
  }
  if (data.rateType && !["percentage", "fixed"].includes(data.rateType)) {
    errors.push("rateType must be one of percentage, fixed");
  }
  if (data.rateValue !== undefined && (typeof data.rateValue !== "number" || data.rateValue < 0)) {
    errors.push("rateValue must be a non-negative number");
  }
  if (data.status && !["pending", "paid", "cancelled"].includes(data.status)) {
    errors.push("status must be one of pending, paid, cancelled");
  }
  return errors;
};

const emitSalonCommissionEvent = (req, event, payload) => {
  try {
    const io = req.app?.get("io");
    if (!io) return;
    const room = `salon:commissions:${req.tenant?.id}`;
    io.to(room).emit(event, payload);
  } catch (err) {
    console.error("Failed to emit salon commission event:", err.message);
  }
};

const commissionController = {
  async getAllCommissions(req, res) {
    try {
      const tenantId = req.tenant?.id;
      const result = await commissionDao.findAllForTenant(tenantId, req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getCommission(req, res) {
    try {
      const tenantId = req.tenant?.id;
      const commission = await commissionDao.findById(req.params.id, tenantId);
      if (!commission) {
        return res.status(404).json({ success: false, message: "Commission not found" });
      }
      res.json({ success: true, data: commission });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async createCommission(req, res) {
    try {
      const tenantId = req.tenant?.id;
      const validationErrors = validateCommission(req.body);
      if (validationErrors.length) {
        return res.status(422).json({ success: false, message: "Validation failed", errors: validationErrors });
      }
      const data = { ...req.body, tenantId };
      const commission = await commissionDao.createCommission(data);

      await logAction(req, "commission_created", {
        commissionId: commission.id,
        userId: commission.userId,
        amount: commission.amount,
      });

      emitSalonCommissionEvent(req, "salon-commission-created", commission);
      res.status(201).json({ success: true, data: commission });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async updateCommission(req, res) {
    try {
      const tenantId = req.tenant?.id;
      const validationErrors = validateCommission(req.body);
      if (validationErrors.length) {
        return res.status(422).json({ success: false, message: "Validation failed", errors: validationErrors });
      }
      const allowed = ["amount", "rateType", "rateValue", "status", "paidAt", "notes"];
      const updates = {};
      for (const key of allowed) {
        if (Object.prototype.hasOwnProperty.call(req.body, key)) {
          updates[key] = req.body[key];
        }
      }
      const commission = await commissionDao.updateCommission(req.params.id, tenantId, updates);
      if (!commission) {
        return res.status(404).json({ success: false, message: "Commission not found" });
      }

      await logAction(req, "commission_updated", {
        commissionId: commission.id,
        changes: updates,
      });

      emitSalonCommissionEvent(req, "salon-commission-updated", commission);
      res.json({ success: true, data: commission });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async deleteCommission(req, res) {
    try {
      const tenantId = req.tenant?.id;
      const deleted = await commissionDao.deleteCommission(req.params.id, tenantId);
      if (!deleted) {
        return res.status(404).json({ success: false, message: "Commission not found" });
      }
      await logAction(req, "commission_deleted", {
        commissionId: req.params.id,
      });
      emitSalonCommissionEvent(req, "salon-commission-deleted", { id: req.params.id });
      res.json({ success: true, message: "Commission deleted" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async markCommissionPaid(req, res) {
    try {
      const tenantId = req.tenant?.id;
      const commission = await commissionDao.markAsPaid(req.params.id, tenantId);
      if (!commission) {
        return res.status(404).json({ success: false, message: "Commission not found or already paid" });
      }
      await logAction(req, "commission_paid", {
        commissionId: commission.id,
        userId: commission.userId,
        amount: commission.amount,
      });
      emitSalonCommissionEvent(req, "salon-commission-paid", commission);
      res.json({ success: true, data: commission });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getPendingTotal(req, res) {
    try {
      const tenantId = req.tenant?.id;
      const userId = req.query.userId ? Number(req.query.userId) : null;
      const total = await commissionDao.getPendingTotal(tenantId, userId);
      res.json({ success: true, total });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = commissionController;
