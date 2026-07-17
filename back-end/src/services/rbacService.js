const roleDAO = require("../DAOs/role.dao");
const groupDAO = require("../DAOs/group.dao");
const templateDAO = require("../DAOs/permissionTemplate.dao");

const getAllRoles = async (tenantId) => {
  return await roleDAO.findAllRoles(tenantId);
};

const getRole = async (id, tenantId) => {
  const role = await roleDAO.findRoleById(id, tenantId);
  if (!role) throw { status: 404, message: "Role not found!" };
  return role;
};

const createRole = async (roleData, tenantId) => {
  const existing = await roleDAO.findRoleByName(roleData.name, tenantId);
  if (existing) {
    throw { status: 400, message: "Role with this name already exists!" };
  }
  return await roleDAO.createRole(roleData, tenantId);
};

const updateRole = async (id, updates, tenantId) => {
  if (updates.name) {
    const existing = await roleDAO.findRoleByName(updates.name, tenantId);
    if (existing && existing.id !== id) {
      throw { status: 400, message: "Role with this name already exists!" };
    }
  }
  const role = await roleDAO.updateRole(id, updates, tenantId);
  if (!role) throw { status: 404, message: "Role not found!" };
  return role;
};

const deleteRole = async (id, tenantId) => {
  await roleDAO.deleteRole(id, tenantId);
  return true;
};

const getPermissionsForUser = async (userId) => {
  return await roleDAO.getRolePermissions(userId);
};

const getAllGroups = async (tenantId) => {
  return await groupDAO.findAllGroups(tenantId);
};

const getGroup = async (id, tenantId) => {
  const group = await groupDAO.findGroupById(id, tenantId);
  if (!group) throw { status: 404, message: "Group not found!" };
  return group;
};

const getGroupByName = async (name, tenantId) => {
  const group = await groupDAO.findGroupByName(name, tenantId);
  if (!group) throw { status: 404, message: "Group not found!" };
  return group;
};

const createGroup = async (groupData, tenantId) => {
  const existing = await groupDAO.findGroupByName(groupData.name, tenantId);
  if (existing) {
    throw { status: 400, message: "Group with this name already exists!" };
  }
  return await groupDAO.createGroup(groupData, tenantId);
};

const updateGroup = async (id, updates, tenantId) => {
  if (updates.name) {
    const existing = await groupDAO.findGroupByName(updates.name, tenantId);
    if (existing && existing.id !== id) {
      throw { status: 400, message: "Group with this name already exists!" };
    }
  }
  const group = await groupDAO.updateGroup(id, updates, tenantId);
  if (!group) throw { status: 404, message: "Group not found!" };
  return group;
};

const deleteGroup = async (id, tenantId) => {
  await groupDAO.deleteGroup(id, tenantId);
  return true;
};

const addUserToGroup = async (groupId, userId, tenantId) => {
  const result = await groupDAO.addUserToGroup(groupId, userId, tenantId);
  if (!result) throw { status: 404, message: "Group or user not found!" };
  return result;
};

const removeUserFromGroup = async (groupId, userId, tenantId) => {
  const result = await groupDAO.removeUserFromGroup(groupId, userId, tenantId);
  if (!result) throw { status: 404, message: "Group or user not found!" };
  return result;
};

const getAllTemplates = async (tenantId) => {
  return await templateDAO.findAllTemplates(tenantId);
};

const getTemplate = async (id, tenantId) => {
  const template = await templateDAO.findTemplateById(id, tenantId);
  if (!template) throw { status: 404, message: "Template not found!" };
  return template;
};

const createTemplate = async (templateData, tenantId) => {
  const existing = await templateDAO.findTemplateByName(templateData.name, tenantId);
  if (existing) {
    throw { status: 400, message: "Template with this name already exists!" };
  }
  return await templateDAO.createTemplate(templateData, tenantId);
};

const updateTemplate = async (id, updates, tenantId) => {
  if (updates.name) {
    const existing = await templateDAO.findTemplateByName(updates.name, tenantId);
    if (existing && existing.id !== id) {
      throw { status: 400, message: "Template with this name already exists!" };
    }
  }
  const template = await templateDAO.updateTemplate(id, updates, tenantId);
  if (!template) throw { status: 404, message: "Template not found!" };
  return template;
};

const deleteTemplate = async (id, tenantId) => {
  await templateDAO.deleteTemplate(id, tenantId);
  return true;
};

const searchTemplates = async (query, tenantId) => {
  return await templateDAO.searchTemplates(query, tenantId);
};

module.exports = {
  getAllRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  getPermissionsForUser,
  getAllGroups,
  getGroup,
  getGroupByName,
  createGroup,
  updateGroup,
  deleteGroup,
  addUserToGroup,
  removeUserFromGroup,
  getAllTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  searchTemplates,
};

