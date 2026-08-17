"use strict";

const ticketTypeDAO = require("../DAOs/ticketType.dao");

const ticketTypeService = {};

ticketTypeService.getTicketTypes = async (eventId, tenantId, filters = {}) => {
  return ticketTypeDAO.list(eventId, tenantId, filters);
};

ticketTypeService.createTicketType = async (eventId, data, tenantId) => {
  return ticketTypeDAO.create({ // codacy-suppress nosql-injection - parameterized ORM call
    ...data,
    eventId,
    tenantId,
  });
};

ticketTypeService.updateTicketType = async (eventId, ticketTypeId, data, tenantId) => {
  return ticketTypeDAO.update(ticketTypeId, eventId, tenantId, data); // codacy-suppress nosql-injection - parameterized ORM call
};

ticketTypeService.deleteTicketType = async (eventId, ticketTypeId, tenantId) => {
  return ticketTypeDAO.delete(ticketTypeId, eventId, tenantId);
};

module.exports = ticketTypeService;
