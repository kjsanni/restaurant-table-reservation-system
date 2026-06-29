const rbacService = require("../services/rbacService");

const getAllRolesHandler = async (req, res) => {
  const roles = await rbacService.getAllRoles();
  return res.status(200).json({ success: true, roles });
};

const getRoleHandler = async (req, res) => {
  const role = await rbacService.getRole(req.params.id);
  return res.status(200).json({ success: true, role });
};

const createRoleHandler = async (req, res) => {
  const role = await rbacService.createRole(req.body);
  return res.status(201).json({ success: true, message: "Role created!", role });
};

const updateRoleHandler = async (req, res) => {
  const role = await rbacService.updateRole(req.params.id, req.body);
  return res.status(200).json({ success: true, message: "Role updated!", role });
};

const deleteRoleHandler = async (req, res) => {
  await rbacService.deleteRole(req.params.id);
  return res.status(200).json({ success: true, message: "Role deleted!" });
};

const getAllGroupsHandler = async (req, res) => {
  const groups = await rbacService.getAllGroups();
  return res.status(200).json({ success: true, groups });
};

const getGroupHandler = async (req, res) => {
  const group = await rbacService.getGroup(req.params.id);
  return res.status(200).json({ success: true, group });
};

const getGroupByNameHandler = async (req, res) => {
  const group = await rbacService.getGroupByName(req.params.name);
  return res.status(200).json({ success: true, group });
};

const createGroupHandler = async (req, res) => {
  const group = await rbacService.createGroup(req.body);
  return res.status(201).json({ success: true, message: "Group created!", group });
};

const updateGroupHandler = async (req, res) => {
  const group = await rbacService.updateGroup(req.params.id, req.body);
  return res.status(200).json({ success: true, message: "Group updated!", group });
};

const deleteGroupHandler = async (req, res) => {
  await rbacService.deleteGroup(req.params.id);
  return res.status(200).json({ success: true, message: "Group deleted!" });
};

const addUserToGroupHandler = async (req, res) => {
  const { userId } = req.body;
  const result = await rbacService.addUserToGroup(req.params.id, userId);
  return res.status(200).json({ success: true, message: "User added to group!", group: result });
};

const removeUserFromGroupHandler = async (req, res) => {
  const { userId } = req.body;
  const result = await rbacService.removeUserFromGroup(req.params.id, userId);
  return res.status(200).json({ success: true, message: "User removed from group!", group: result });
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
};
