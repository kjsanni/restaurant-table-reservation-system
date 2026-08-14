"use strict";

const { getClient } = require("../client");
const { mapReservationToInvoice, mapAppointmentToInvoice } = require("../mappers/customer.mapper");
const db = require("../../../db/models");

const createErpnextInvoice = async (entity, tenant, entityType) => {
  const mapper = entityType === "appointment" ? mapAppointmentToInvoice : mapReservationToInvoice;
  const payload = mapper(entity, tenant, entity.service);

  // codacy-suppress NoSqlInjection
  const existing = await db.erpnextSync.findOne({
    where: {
      tenantId: tenant.id,
      rtrsEntityType: entityType,
      rtrsEntityId: entity.id,
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
    rtrsEntityType: entityType,
    rtrsEntityId: entity.id,
    erpnextDocType: "Sales Invoice",
    erpnextDocname: erpnextInvoice.name,
    erpnextDocStatus: erpnextInvoice.status || "Draft",
  });

  return erpnextInvoice;
};

const syncInvoice = async (tenantId, entityId, entityType = "reservation") => {
  let entity = null;
  let include = [];

  if (entityType === "appointment") {
    entity = await db.appointment.findByPk(entityId, {
      where: { tenantId },
      include: [
        { model: db.customer, as: "customer" },
        { model: db.service, as: "service" },
      ],
    });
    if (!entity) {
      throw new Error(`Appointment ${entityId} not found for tenant ${tenantId}`);
    }
  } else {
    entity = await db.reservation.findByPk(entityId, {
      where: { tenantId },
      include: [{ model: db.customer, as: "customer" }],
    });
    if (!entity) {
      throw new Error(`Reservation ${entityId} not found for tenant ${tenantId}`);
    }
  }

  return createErpnextInvoice(entity, await db.tenant.findByPk(tenantId), entityType);
};

const syncAllInvoices = async (tenantId) => {
  const tenant = await db.tenant.findByPk(tenantId);
  const results = [];

  const reservations = await db.reservation.findAll({
    where: { tenantId, paymentStatus: { [db.Sequelize.Op.ne]: "unpaid" } },
    include: [{ model: db.customer, as: "customer" }],
  });

  for (const reservation of reservations) {
    try {
      const result = await createErpnextInvoice(reservation, tenant, "reservation");
      results.push({ reservationId: reservation.id, status: "success", erpnextName: result.name });
    } catch (err) {
      results.push({ reservationId: reservation.id, status: "failed", error: err.message });
    }
  }

  if (db.appointment) {
    const appointments = await db.appointment.findAll({
      where: { tenantId, paymentStatus: { [db.Sequelize.Op.ne]: "unpaid" } },
      include: [
        { model: db.customer, as: "customer" },
        { model: db.service, as: "service" },
      ],
    });

    for (const appointment of appointments) {
      try {
        const result = await createErpnextInvoice(appointment, tenant, "appointment");
        results.push({ appointmentId: appointment.id, status: "success", erpnextName: result.name });
      } catch (err) {
        results.push({ appointmentId: appointment.id, status: "failed", error: err.message });
      }
    }
  }

  return results;
};

module.exports = {
  syncInvoice,
  syncAllInvoices,
};
