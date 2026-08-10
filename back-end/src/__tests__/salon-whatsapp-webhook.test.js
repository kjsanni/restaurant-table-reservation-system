"use strict";

const salonWhatsAppController = require("../verticals/salon/controllers/salonWhatsApp.controller");

jest.mock("../tenant-platform/services/paystack.service", () => ({
  verifyWebhookSignature: jest.fn(),
}));

jest.mock("../db/models", () => ({
  appointment: {
    findByPk: jest.fn(),
  },
  user: {
    findByPk: jest.fn(),
  },
}));

jest.mock("../services/messageTemplates.service", () => ({
  render: jest.fn(async (name, vars) => `Payment confirmed for appointment #${vars?.appointmentId} on ${vars?.date} at ${vars?.time}.`),
}));

jest.mock("../services/notification.service", () => ({
  sendWithSmsFallback: jest.fn().mockResolvedValue({}),
}));

describe("salonWhatsApp.controller", () => {
  const mockAppointment = {
    id: 1,
    tenantId: 1,
    customerId: 5,
    paymentStatus: "pending",
    paymentReference: "ref-123",
    start: new Date("2026-08-01T10:00:00.000Z").toISOString(),
    update: jest.fn().mockResolvedValue({
      id: 1,
      tenantId: 1,
      customerId: 5,
      paymentStatus: "paid",
      depositAmount: 50,
    }),
  };

  const mockCustomer = {
    phone: "+233241234567",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("salonPaymentConfirmationHandler", () => {
    it("rejects invalid webhook signature", async () => {
      const { verifyWebhookSignature } = require("../tenant-platform/services/paystack.service");
      verifyWebhookSignature.mockResolvedValue(false);

      const req = {
        headers: { "x-paystack-signature": "bad-sig" },
        body: { event: "charge.success", data: {} },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      await salonWhatsAppController.salonPaymentConfirmationHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid signature",
      });
    });

    it("processes charge.success and marks appointment paid", async () => {
      const { verifyWebhookSignature } = require("../tenant-platform/services/paystack.service");
      verifyWebhookSignature.mockResolvedValue(true);

      const db = require("../db/models");
      db.appointment.findByPk.mockResolvedValue(mockAppointment);
      mockAppointment.update.mockResolvedValue({
        ...mockAppointment,
        paymentStatus: "paid",
        depositAmount: 50,
      });
      db.user.findByPk.mockResolvedValue(mockCustomer);

      const req = {
        headers: { "x-paystack-signature": "sig" },
        body: {
          event: "charge.success",
          data: {
            metadata: { appointmentId: 1 },
            amount: 5000,
          },
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      await salonWhatsAppController.salonPaymentConfirmationHandler(req, res);

      expect(mockAppointment.update).toHaveBeenCalledWith({
        paymentStatus: "paid",
        depositAmount: 50,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it("ignores charge.success when appointment is already paid", async () => {
      const { verifyWebhookSignature } = require("../tenant-platform/services/paystack.service");
      verifyWebhookSignature.mockResolvedValue(true);

      const db = require("../db/models");
      db.appointment.findByPk.mockResolvedValue({ ...mockAppointment, paymentStatus: "paid" });

      const req = {
        headers: { "x-paystack-signature": "sig" },
        body: {
          event: "charge.success",
          data: {
            metadata: { appointmentId: 1 },
            amount: 5000,
          },
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      await salonWhatsAppController.salonPaymentConfirmationHandler(req, res);

      expect(mockAppointment.update).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("ignores charge.success when appointment is missing", async () => {
      const { verifyWebhookSignature } = require("../tenant-platform/services/paystack.service");
      verifyWebhookSignature.mockResolvedValue(true);

      const db = require("../db/models");
      db.appointment.findByPk.mockResolvedValue(null);

      const req = {
        headers: { "x-paystack-signature": "sig" },
        body: {
          event: "charge.success",
          data: {
            metadata: { appointmentId: 1 },
            amount: 5000,
          },
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      await salonWhatsAppController.salonPaymentConfirmationHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("skips notification when customer has no phone", async () => {
      const { verifyWebhookSignature } = require("../tenant-platform/services/paystack.service");
      verifyWebhookSignature.mockResolvedValue(true);

      const db = require("../db/models");
      db.appointment.findByPk.mockResolvedValue(mockAppointment);
      mockAppointment.update.mockResolvedValue({
        ...mockAppointment,
        paymentStatus: "paid",
        depositAmount: 50,
      });
      db.user.findByPk.mockResolvedValue({ phone: null });

      const { sendWithSmsFallback } = require("../services/notification.service");
      sendWithSmsFallback.mockClear();

      const req = {
        headers: { "x-paystack-signature": "sig" },
        body: {
          event: "charge.success",
          data: {
            metadata: { appointmentId: 1 },
            amount: 5000,
          },
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      await salonWhatsAppController.salonPaymentConfirmationHandler(req, res);

      expect(sendWithSmsFallback).not.toHaveBeenCalled();
    });

    it("returns 200 for non-charge-success events", async () => {
      const { verifyWebhookSignature } = require("../tenant-platform/services/paystack.service");
      verifyWebhookSignature.mockResolvedValue(true);

      const req = {
        headers: { "x-paystack-signature": "sig" },
        body: {
          event: "charge.failed",
          data: {},
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      await salonWhatsAppController.salonPaymentConfirmationHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
