"use strict";

const { getClient } = require("../client");
const { mapReservationToInvoice } = require("../mappers/customer.mapper");
const db = require("../../../db/models");

const createErpnextInvoice = async (reservation, tenant) => {
  const payload = mapReservationToInvoice(reservation, tenant);

// codacy-suppress NoSqlInjection
  const existing = await db.erpnextSync.findOne({
    where: {
      tenantId: tenant.id,
      rtrsEntityType: "reservation",
      rtrsEntityId: reservation.id,
    },
  });

  if (existing && existing.erpnextDocname) {
    const result = await (await getClient()).put(`/api/resource/Sales Invoice/${existing.erpnextDocname}`, payload);
    return result.data;
  }

  const result = await (await getClient()).post("/api/resource/Sales Invoice", payload);
  const erpnextInvoice = result.data.data;

  await db.erpnextSync.upsert({
    tenantId: tenant.id,
    rtrsEntityType: "reservation",
    rtrsEntityId: reservation.id,
    erpnextDocType: "Sales Invoice",
    erpnextDocname: erpnextInvoice.name,
    erpnextDocStatus: erpnextInvoice.status || "Draft",
  });

  return erpnextInvoice;
};

const syncInvoice = async (tenantId, reservationId) => {
  const reservation = await db.reservation.findByPk(reservationId, {
    where: { tenantId },
    include: [{ model: db.customer, as: "customer" }],
  });
  if (!reservation) {
    throw new Error(`Reservation ${reservationId} not found for tenant ${tenantId}`);
  }
  return createErpnextInvoice(reservation, await db.tenant.findByPk(tenantId));
};

const syncAllInvoices = async (tenantId) => {
  const reservations = await db.reservation.findAll({
    where: { tenantId, paymentStatus: { [db.Sequelize.Op.ne]: "unpaid" } },
    include: [{ model: db.customer, as: "customer" }],
  });
  const tenant = await db.tenant.findByPk(tenantId);
  const results = [];
  for (const reservation of reservations) {
    try {
      const result = await createErpnextInvoice(reservation, tenant);
      results.push({ reservationId: reservation.id, status: "success", erpnextName: result.name });
    } catch (err) {
      results.push({ reservationId: reservation.id, status: "failed", error: err.message });
    }
  }
  return results;
};

module.exports = {
  syncInvoice,
  syncAllInvoices,
};