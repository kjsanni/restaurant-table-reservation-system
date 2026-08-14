"use strict";

const eventService = require("../services/event.service");

const getEventsHandler = async (req, res) => {
  const result = await eventService.getEvents(req.tenant?.id, req.query);
  res.status(200).json(result);
};

const getEventHandler = async (req, res) => {
  const event = await eventService.getEventById(req.params.id, req.tenant?.id);
  if (!event) {
    return res.status(404).json({ success: false, message: "Event not found" });
  }
  res.status(200).json({ success: true, item: event });
};

const createEventHandler = async (req, res) => {
  const event = await eventService.createEvent(req.body, req.tenant?.id, req.user?.id);
  res.status(201).json({ success: true, item: event });
};

const updateEventHandler = async (req, res) => {
  const event = await eventService.updateEvent(req.params.id, req.body, req.tenant?.id);
  if (!event) {
    return res.status(404).json({ success: false, message: "Event not found" });
  }
  res.status(200).json({ success: true, item: event });
};

const deleteEventHandler = async (req, res) => {
  const deleted = await eventService.deleteEvent(req.params.id, req.tenant?.id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: "Event not found" });
  }
  res.status(200).json({ success: true, message: "Event deleted" });
};

module.exports = {
  getEventsHandler,
  getEventHandler,
  createEventHandler,
  updateEventHandler,
  deleteEventHandler,
};
