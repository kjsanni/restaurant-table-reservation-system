"use strict";

const eventTemplateService = require("../services/eventTemplate.service");

const getEventTemplatesHandler = async (req, res) => {
  try {
    const result = await eventTemplateService.getTemplates(req.tenant?.id, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getEventTemplateHandler = async (req, res) => {
  try {
    const template = await eventTemplateService.getTemplateById(req.params.id, req.tenant?.id);
    if (!template) {
      return res.status(404).json({ success: false, message: "Template not found" });
    }
    res.status(200).json({ success: true, item: template });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createEventTemplateHandler = async (req, res) => {
  try {
    const template = await eventTemplateService.createTemplate(req.body, req.tenant?.id, req.user?.id);
    res.status(201).json({ success: true, item: template });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const updateEventTemplateHandler = async (req, res) => {
  try {
    const template = await eventTemplateService.updateTemplate(req.params.id, req.tenant?.id, req.body);
    if (!template) {
      return res.status(404).json({ success: false, message: "Template not found" });
    }
    res.status(200).json({ success: true, item: template });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const deleteEventTemplateHandler = async (req, res) => {
  try {
    const deleted = await eventTemplateService.deleteTemplate(req.params.id, req.tenant?.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Template not found" });
    }
    res.status(200).json({ success: true, message: "Template deleted" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = {
  getEventTemplatesHandler,
  getEventTemplateHandler,
  createEventTemplateHandler,
  updateEventTemplateHandler,
  deleteEventTemplateHandler,
};
