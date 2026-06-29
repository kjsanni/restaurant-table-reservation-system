const roleDAO = require("../DAOs/role.dao");
const groupDAO = require("../DAOs/group.dao");

const getAllRoles = async () => {
  return await roleDAO.findAllRoles();
};

const getRole = async (id) => {
  const role = await roleDAO.findRoleById(id);
  if (!role) throw { status: 404, message: "Role not found!" };
  return role;
};

const createRole = async (roleData) => {
  const existing = await roleDAO.findRoleByName(roleData.name);
  if (existing) {
    throw { status: 400, message: "Role with this name already exists!" };
  }
  return await roleDAO.createRole(roleData);
};

const updateRole = async (id, updates) => {
  if (updates.name) {
    const existing = await roleDAO.findRoleByName(updates.name);
    if (existing && existing.id !== id) {
      throw { status: 400, message: "Role with this name already exists!" };
    }
  }
  const role = await roleDAO.updateRole(id, updates);
  if (!role) throw { status: 404, message: "Role not found!" };
  return role;
};

const deleteRole = async (id) => {
  await roleDAO.deleteRole(id);
  return true;
};

const getPermissionsForUser = async (userId) => {
  return await roleDAO.getRolePermissions(userId);
};

const getAllGroups = async () => {
  return await groupDAO.findAllGroups();
};

const getGroup = async (id) => {
  const group = await groupDAO.findGroupById(id);
  if (!group) throw { status: 404, message: "Group not found!" };
  return group;
};

const getGroupByName = async (name) => {
  const group = await groupDAO.findGroupByName(name);
  if (!group) throw { status: 404, message: "Group not found!" };
  return group;
};

const createGroup = async (groupData) => {
  const existing = await groupDAO.findGroupByName(groupData.name);
  if (existing) {
    throw { status: 400, message: "Group with this name already exists!" };
  }
  return await groupDAO.createGroup(groupData);
};

const updateGroup = async (id, updates) => {
  if (updates.name) {
    const existing = await groupDAO.findGroupByName(updates.name);
    if (existing && existing.id !== id) {
      throw { status: 400, message: "Group with this name already exists!" };
    }
  }
  const group = await groupDAO.updateGroup(id, updates);
  if (!group) throw { status: 404, message: "Group not found!" };
  return group;
};

const deleteGroup = async (id) => {
  await groupDAO.deleteGroup(id);
  return true;
};

const addUserToGroup = async (groupId, userId) => {
  const result = await groupDAO.addUserToGroup(groupId, userId);
  if (!result) throw { status: 404, message: "Group or user not found!" };
  return result;
};

const removeUserFromGroup = async (groupId, userId) => {
  const result = await groupDAO.removeUserFromGroup(groupId, userId);
  if (!result) throw { status: 404, message: "Group or user not found!" };
  return result;
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
};
