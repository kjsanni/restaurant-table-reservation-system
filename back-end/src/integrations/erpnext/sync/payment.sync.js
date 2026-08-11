"use strict";

const { getClient } = require("../client");
const { mapPaymentToErpnext } = require("../mappers/customer.mapper");
const db = require("../../../db/models");

const createErpnextPayment = async (payment, reservation, tenant) => {
  const payload = mapPaymentToErpnext(payment, reservation);

// codacy-suppress NoSqlInjection
  const existing = await db.erpnextSync.findOne({
    where: {
      tenantId: tenant.id,
      rtrsEntityType: "payment",
      rtrsEntityId: payment.id,
    },
  });

  if (existing && existing.erpnextDocname) {
    const result = await getClient().put(`/api/resource/Payment Entry/${existing.erpnextDocname}`, payload);
    return result.data;
  }

  const result = await getClient().post("/api/resource/Payment Entry", payload);
  const erpnextPayment = result.data.data;

  await db.erpnextSync.upsert({
    tenantId: tenant.id,
    rtrsEntityType: "payment",
    rtrsEntityId: payment.id,
    erpnextDocType: "Payment Entry",
    erpnextDocname: erpnextPayment.name,
    erpnextDocStatus: erpnextPayment.status || "Draft",
  });

  return erpnextPayment;
};

const syncPayment = async (tenantId, paymentId) => {
  const payment = await db.payment.findByPk(paymentId, {
    where: { tenantId },
  });
  if (!payment) {
    throw new Error(`Payment ${paymentId} not found for tenant ${tenantId}`);
  }

  let reservation = null;
  if (payment.reservationId) {
    reservation = await db.reservation.findByPk(payment.reservationId, { where: { tenantId } });
  }

  return createErpnextPayment(payment, reservation, await db.tenant.findByPk(tenantId));
};

const syncAllPayments = async (tenantId) => {
  const payments = await db.payment.findAll({ where: { tenantId } });
  const tenant = await db.tenant.findByPk(tenantId);
  const results = [];
  for (const payment of payments) {
    let reservation = null;
    if (payment.reservationId) {
      reservation = await db.reservation.findByPk(payment.reservationId, { where: { tenantId } });
    }
    try {
      const result = await createErpnextPayment(payment, reservation, tenant);
      results.push({ paymentId: payment.id, status: "success", erpnextName: result.name });
    } catch (err) {
      results.push({ paymentId: payment.id, status: "failed", error: err.message });
    }
  }
  return results;
};

module.exports = {
  syncPayment,
  syncAllPayments,
};