const rbacService = require("../services/rbacService");

const getAllRolesHandler = async (req, res) => {
  const roles = await rbacService.getAllRoles(req.tenant?.id);
  return res.status(200).json({ success: true, roles });
};

const getRoleHandler = async (req, res) => {
  const role = await rbacService.getRole(req.params.id, req.tenant?.id);
  return res.status(200).json({ success: true, role });
};

const createRoleHandler = async (req, res) => {
  const role = await rbacService.createRole(req.body, req.tenant?.id);
  return res.status(201).json({ success: true, message: "Role created!", role });
};

const updateRoleHandler = async (req, res) => {
  const role = await rbacService.updateRole(req.params.id, req.body, req.tenant?.id);
  return res.status(200).json({ success: true, message: "Role updated!", role });
};

const deleteRoleHandler = async (req, res) => {
  await rbacService.deleteRole(req.params.id, req.tenant?.id);
  return res.status(200).json({ success: true, message: "Role deleted!" });
};

const getAllGroupsHandler = async (req, res) => {
  const groups = await rbacService.getAllGroups(req.tenant?.id);
  return res.status(200).json({ success: true, groups });
};

const getGroupHandler = async (req, res) => {
  const group = await rbacService.getGroup(req.params.id, req.tenant?.id);
  return res.status(200).json({ success: true, group });
};

const getGroupByNameHandler = async (req, res) => {
  const name = req.params.name;
  if (!name || !/^[a-zA-Z0-9_-]{1,50}$/.test(name)) {
    return res.status(400).json({
      success: false,
      message: "Invalid group name format.",
    });
  }
  const group = await rbacService.getGroupByName(name, req.tenant?.id);
  return res.status(200).json({ success: true, group });
};

const createGroupHandler = async (req, res) => {
  const group = await rbacService.createGroup(req.body, req.tenant?.id);
  return res.status(201).json({ success: true, message: "Group created!", group });
};

const updateGroupHandler = async (req, res) => {
  const group = await rbacService.updateGroup(req.params.id, req.body, req.tenant?.id);
  return res.status(200).json({ success: true, message: "Group updated!", group });
};

const deleteGroupHandler = async (req, res) => {
  await rbacService.deleteGroup(req.params.id, req.tenant?.id);
  return res.status(200).json({ success: true, message: "Group deleted!" });
};

const addUserToGroupHandler = async (req, res) => {
  const { userId } = req.body;
  const result = await rbacService.addUserToGroup(req.params.id, userId, req.tenant?.id);
  return res.status(200).json({ success: true, message: "User added to group!", group: result });
};

const removeUserFromGroupHandler = async (req, res) => {
  const { userId } = req.body;
  const result = await rbacService.removeUserFromGroup(req.params.id, userId, req.tenant?.id);
  return res.status(200).json({ success: true, message: "User removed from group!", group: result });
};

const getAllTemplatesHandler = async (req, res) => {
  const templates = await rbacService.getAllTemplates(req.tenant?.id);
  return res.status(200).json({ success: true, templates });
};

const getTemplateHandler = async (req, res) => {
  const template = await rbacService.getTemplate(req.params.id, req.tenant?.id);
  return res.status(200).json({ success: true, template });
};

const createTemplateHandler = async (req, res) => {
  const template = await rbacService.createTemplate(req.body, req.tenant?.id);
  return res.status(201).json({ success: true, message: "Template created!", template });
};

const updateTemplateHandler = async (req, res) => {
  const template = await rbacService.updateTemplate(req.params.id, req.body, req.tenant?.id);
  return res.status(200).json({ success: true, message: "Template updated!", template });
};

const deleteTemplateHandler = async (req, res) => {
  await rbacService.deleteTemplate(req.params.id, req.tenant?.id);
  return res.status(200).json({ success: true, message: "Template deleted!" });
};

module.exports = {
  getAllRolesHandler,
  getRoleHandler,
  createRoleHandler,
  updateRoleHandler,
  deleteRoleHandler,
  getAllGroupsHandler,
  getGroupHandler,
  getGroupByNameHandler,
  createGroupHandler,
  updateGroupHandler,
  deleteGroupHandler,
  addUserToGroupHandler,
  removeUserFromGroupHandler,
  getAllTemplatesHandler,
  getTemplateHandler,
  createTemplateHandler,
  updateTemplateHandler,
  deleteTemplateHandler,
};
