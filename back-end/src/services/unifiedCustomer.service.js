"use strict";

const db = require("../db/models");

const unifiedCustomerService = {};

unifiedCustomerService.getUnifiedProfile = async (customerId, tenantId) => {
  if (!Number.isInteger(customerId)) {
    throw new Error("Invalid customer ID");
  }
  const customer = await db.customer.findOne({ // nosemgrep: javascript.sequelize.security.audit.sequelize-injection-express.express-sequelize-injection
    where: { id: customerId },
    include: [
      { association: "reservations", separate: true, limit: 50 },
      { model: db.eventBooking, as: "eventBookings", separate: true, limit: 50 },
    ],
  });

  if (!customer) return null;

  const reservations = customer.reservations || [];
  const eventBookings = customer.eventBookings || [];

  const totalVisits = reservations.length + eventBookings.length;
  const totalSpent = reservations.reduce((sum, r) => sum + Number(r.total || 0), 0) +
    eventBookings.filter((b) => b.paymentStatus === "paid").reduce((sum, b) => sum + Number(b.total || 0), 0);

  return {
    customerId: customer.id,
    name: `${customer.firstName} ${customer.lastName}`,
    email: customer.email,
    phone: customer.phone,
    points: customer.points || 0,
    totalVisits,
    totalSpent,
    verticals: {
      restaurant: reservations.length,
      event: eventBookings.length,
    },
    recentActivity: [
      ...reservations.map((r) => ({
        type: "reservation",
        date: r.createdAt,
        title: r.tableId ? `Table reservation` : `Reservation`,
        status: r.status,
        total: r.total,
      })),
      ...eventBookings.map((b) => ({
        type: "event_booking",
        date: b.createdAt,
        title: b.event?.name || "Event booking",
        status: b.status,
        total: b.total,
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20),
  };
};

unifiedCustomerService.getCrossVerticalHistory = async (customerId, tenantId) => {
  if (!Number.isInteger(customerId)) {
    throw new Error("Invalid customer ID");
  }
  const [reservations, eventBookings] = await Promise.all([
    db.reservation.findAll({
      where: { customerId },
      include: [{ model: db.tenant, as: "tenant", attributes: ["id", "name", "slug", "businessVertical"] }],
      order: [["createdAt", "DESC"]],
      limit: 50,
    }),
    db.eventBooking.findAll({
      where: { customerId },
      include: [
        { model: db.event, as: "event", attributes: ["id", "name", "eventDate", "status"] },
        { model: db.tenant, as: "tenant", attributes: ["id", "name", "slug", "businessVertical"] },
      ],
      order: [["createdAt", "DESC"]],
      limit: 50,
    }),
  ]);

  return {
    reservations: reservations.map((r) => ({
      id: r.id,
      type: "reservation",
      vertical: r.tenant?.businessVertical || "restaurant",
      tenantName: r.tenant?.name,
      date: r.createdAt,
      status: r.status,
      total: r.total,
    })),
    events: eventBookings.map((b) => ({
      id: b.id,
      type: "event_booking",
      vertical: "event",
      tenantName: b.tenant?.name,
      eventName: b.event?.name,
      eventDate: b.event?.eventDate,
      date: b.createdAt,
      status: b.status,
      paymentStatus: b.paymentStatus,
      total: b.total,
    })),
  };
};

unifiedCustomerService.addLoyaltyPoints = async (customerId, points, source, tenantId) => {
  if (!Number.isInteger(customerId)) {
    throw new Error("Invalid customer ID");
  }
  const customer = await db.customer.findByPk(customerId);
  if (!customer) throw new Error("Customer not found");

  const updated = await customer.update({
    points: (customer.points || 0) + points,
  });

  await db.loyaltyTransaction.create({
    customerId,
    tenantId: tenantId || customer.tenantId,
    points,
    source: source || "manual",
    balance: updated.points,
  });

  return updated;
};

unifiedCustomerService.redeemLoyaltyPoints = async (customerId, points, tenantId) => {
  if (!Number.isInteger(customerId)) {
    throw new Error("Invalid customer ID");
  }
  const customer = await db.customer.findByPk(customerId);
  if (!customer) throw new Error("Customer not found");
  if ((customer.points || 0) < points) {
    throw new Error("Insufficient points");
  }

  const updated = await customer.update({
    points: (customer.points || 0) - points,
  });

  await db.loyaltyTransaction.create({
    customerId,
    tenantId: tenantId || customer.tenantId,
    points: -points,
    source: "redemption",
    balance: updated.points,
  });

  return updated;
};

module.exports = unifiedCustomerService;
