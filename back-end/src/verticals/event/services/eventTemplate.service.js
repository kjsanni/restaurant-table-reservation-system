"use strict";

const eventTemplateDAO = require("../DAOs/eventTemplate.dao");

const eventTemplateService = {};

eventTemplateService.createTemplate = async (data, tenantId, userId) => {
  return eventTemplateDAO.create({
    tenantId: tenantId || null,
    name: data.name,
    description: data.description || null,
    category: data.category || "general",
    config: data.config || {},
    isSystem: false,
    isActive: true,
  });
};

eventTemplateService.getTemplates = async (tenantId, filters = {}) => {
  const tenantTemplates = await eventTemplateDAO.list(tenantId, filters);
  const systemTemplates = await eventTemplateDAO.list(null, { ...filters, isSystem: true });
  return {
    rows: [...systemTemplates.rows, ...tenantTemplates.rows],
    count: systemTemplates.count + tenantTemplates.count,
  };
};

eventTemplateService.getTemplateById = async (id, tenantId) => {
  return eventTemplateDAO.findById(id, tenantId);
};

eventTemplateService.updateTemplate = async (id, tenantId, data) => {
  return eventTemplateDAO.update(id, tenantId, {
    name: data.name,
    description: data.description,
    category: data.category,
    config: data.config,
    isActive: data.isActive,
  });
};

eventTemplateService.deleteTemplate = async (id, tenantId) => {
  return eventTemplateDAO.remove(id, tenantId);
};

module.exports = eventTemplateService;
