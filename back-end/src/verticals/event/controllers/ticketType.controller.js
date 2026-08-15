"use strict";

const ticketTypeService = require("../services/ticketType.service");

const getTicketTypesHandler = async (req, res) => {
  const filters = {
    limit: req.query?.limit,
    page: req.query?.page,
    pageSize: req.query?.pageSize,
  };
  const result = await ticketTypeService.getTicketTypes(req.params.eventId, req.tenant?.id, filters);
  res.status(200).json(result);
};

const createTicketTypeHandler = async (req, res) => {
  const ticketType = await ticketTypeService.createTicketType(req.params.eventId, req.body, req.tenant?.id);
  res.status(201).json({ success: true, item: ticketType });
};

const updateTicketTypeHandler = async (req, res) => {
  const ticketType = await ticketTypeService.updateTicketType(req.params.eventId, req.params.ticketTypeId, req.body, req.tenant?.id);
  if (!ticketType) {
    return res.status(404).json({ success: false, message: "Ticket type not found" });
  }
  res.status(200).json({ success: true, item: ticketType });
};

const deleteTicketTypeHandler = async (req, res) => {
  const deleted = await ticketTypeService.deleteTicketType(req.params.eventId, req.params.ticketTypeId, req.tenant?.id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: "Ticket type not found" });
  }
  res.status(200).json({ success: true, message: "Ticket type deleted" });
};

module.exports = {
  getTicketTypesHandler,
  createTicketTypeHandler,
  updateTicketTypeHandler,
  deleteTicketTypeHandler,
};
