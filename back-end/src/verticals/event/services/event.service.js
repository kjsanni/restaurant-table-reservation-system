"use strict";

const eventDAO = require("../DAOs/event.dao");
const guestListDAO = require("../DAOs/guestList.dao");
const ticketTypeDAO = require("../DAOs/ticketType.dao");
const qrCodeDAO = require("../DAOs/qrCode.dao");
const qrCodeService = require("./qrCode.service");

const eventService = {};

eventService.getEvents = async (tenantId, filters = {}) => {
  return eventDAO.list(tenantId, filters);
};

eventService.getEventById = async (id, tenantId) => {
  return eventDAO.findById(id, tenantId);
};

eventService.createEvent = async (data, tenantId, createdById) => {
  if (!data.name || !data.eventDate) {
    throw new Error("Event name and date are required");
  }

  return eventDAO.create({ // codacy-suppress nosql-injection - parameterized ORM call
    ...data,
    tenantId,
    createdById,
    status: data.status || "draft",
  });
};

eventService.updateEvent = async (id, data, tenantId) => {
  const event = await eventDAO.findById(id, tenantId);
  if (!event) {
    throw new Error("Event not found");
  }

  const allowedFields = ["name", "description", "eventType", "venue", "address", "eventDate", "startTime", "endTime", "capacity", "status", "isTicketed", "requiresApproval", "checkinEnabled", "metadata"];
  const updates = {};
  allowedFields.forEach((field) => {
    if (data[field] !== undefined) {
      updates[field] = data[field];
    }
  });

  return eventDAO.update(id, tenantId, updates); // codacy-suppress nosql-injection - parameterized ORM call
};

eventService.deleteEvent = async (id, tenantId) => {
  const event = await eventDAO.findById(id, tenantId);
  if (!event) {
    throw new Error("Event not found");
  }

  await guestListDAO.deleteByEventId(id, tenantId);
  await ticketTypeDAO.deleteByEventId(id, tenantId);
  await qrCodeDAO.deleteByEventId(id, tenantId);

  return eventDAO.delete(id, tenantId);
};

eventService.getGuestList = async (eventId, tenantId, filters = {}) => {
  return guestListDAO.list(eventId, tenantId, filters);
};

eventService.addGuest = async (eventId, data, tenantId) => {
  if (!data.guestName) {
    throw new Error("Guest name is required");
  }

  return guestListDAO.create({ // codacy-suppress nosql-injection - parameterized ORM call
    eventId,
    tenantId,
    guestName: data.guestName,
    guestEmail: data.guestEmail || null,
    guestPhone: data.guestPhone || null,
    ticketTypeId: data.ticketTypeId || null,
    status: data.status || "invited",
    notes: data.notes || null,
  });
};

eventService.updateGuest = async (eventId, guestId, data, tenantId) => {
  const guest = await guestListDAO.findById(guestId, eventId, tenantId);
  if (!guest) {
    throw new Error("Guest not found");
  }

  const allowedFields = ["guestName", "guestEmail", "guestPhone", "ticketTypeId", "status", "checkedInAt", "checkedInById", "notes", "metadata"];
  const updates = {};
  allowedFields.forEach((field) => {
    if (data[field] !== undefined) {
      updates[field] = data[field];
    }
  });

  return guestListDAO.update(guestId, eventId, tenantId, updates); // codacy-suppress nosql-injection - parameterized ORM call
};

eventService.removeGuest = async (eventId, guestId, tenantId) => {
  const deleted = await guestListDAO.delete(guestId, eventId, tenantId);
  if (!deleted) {
    throw new Error("Guest not found");
  }

  return true;
};

eventService.generateGuestQRCode = async (eventId, guestId, tenantId) => {
  const guest = await guestListDAO.findById(guestId, eventId, tenantId);
  if (!guest) {
    throw new Error("Guest not found");
  }

  const existingQR = await qrCodeDAO.findByGuestListId(guestId, tenantId);
  if (existingQR) {
    return existingQR;
  }

  const qrCode = await qrCodeService.generateQRCode(eventId, { guestListId: guestId }, tenantId);

  await guestListDAO.update(guestId, eventId, tenantId, { qrCodeId: qrCode.id }); // codacy-suppress nosql-injection - parameterized ORM call

  return qrCode;
};

eventService.checkinByCode = async (code, tenantId, userId) => {
  const qrCode = await qrCodeDAO.findByCode(code, tenantId);
  if (!qrCode) {
    throw new Error("Invalid QR code");
  }

  if (qrCode.status === "used") {
    return { ...qrCode.toJSON(), message: "QR code already used" };
  }

  if (qrCode.status === "cancelled") {
    throw new Error("QR code is cancelled");
  }

  const now = new Date();
  const updated = await qrCodeDAO.update(qrCode.id, tenantId, { // codacy-suppress nosql-injection - parameterized ORM call
    status: "used",
    checkedInAt: now,
    checkedInById: userId,
  });

  if (qrCode.guestListId) {
    await guestListDAO.update(qrCode.guestListId, qrCode.eventId, tenantId, { // codacy-suppress nosql-injection - parameterized ORM call
      status: "checked_in",
      checkedInAt: now,
      checkedInById: userId,
    });
  }

  return updated;
};

eventService.getTicketTypes = async (eventId, tenantId, filters = {}) => {
  return ticketTypeDAO.list(eventId, tenantId, filters);
};

eventService.createTicketType = async (eventId, data, tenantId) => {
  if (!data.name) {
    throw new Error("Ticket type name is required");
  }

  return ticketTypeDAO.create({ // codacy-suppress nosql-injection - parameterized ORM call
    eventId,
    tenantId,
    name: data.name,
    description: data.description || null,
    price: data.price || 0,
    currency: data.currency || "GHS",
    quantity: data.quantity || 0,
    isActive: data.isActive !== false,
    metadata: data.metadata || null,
  });
};

eventService.updateTicketType = async (eventId, ticketTypeId, data, tenantId) => {
  const ticketType = await ticketTypeDAO.findById(ticketTypeId, eventId, tenantId);
  if (!ticketType) {
    throw new Error("Ticket type not found");
  }

  const allowedFields = ["name", "description", "price", "currency", "quantity", "isActive", "metadata"];
  const updates = {};
  allowedFields.forEach((field) => {
    if (data[field] !== undefined) {
      updates[field] = data[field];
    }
  });

  return ticketTypeDAO.update(ticketTypeId, eventId, tenantId, updates); // codacy-suppress nosql-injection - parameterized ORM call
};

eventService.deleteTicketType = async (eventId, ticketTypeId, tenantId) => {
  const deleted = await ticketTypeDAO.delete(ticketTypeId, eventId, tenantId);
  if (!deleted) {
    throw new Error("Ticket type not found");
  }

  return true;
};

eventService.getQRCodes = async (eventId, tenantId, filters = {}) => {
  return qrCodeDAO.list(eventId, tenantId, filters);
};

eventService.generateQRCode = async (eventId, data, tenantId) => {
  return qrCodeService.generateQRCode(eventId, data, tenantId);
};

module.exports = eventService;
