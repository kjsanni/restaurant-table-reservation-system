const db = require("../db/models");
const Group = db.group;
const User = db.user;
const { Op } = db.Sequelize;

const withTenant = (where = {}, tenantId) => (tenantId ? { ...where, tenantId } : where);

const findAllGroups = async (tenantId) => {
  const groups = await Group.findAll({
    where: withTenant({}, tenantId),
    order: [["id", "ASC"]],
  });
  return groups.map((g) => {
    if (!g.permissions || typeof g.permissions !== "object") {
      g.permissions = {};
    }
    return g;
  });
};

const findGroupById = async (id, tenantId) => {
  const group = await Group.findOne({
    where: withTenant({ id }, tenantId),
    include: [
      {
        model: User,
        through: { attributes: ["id"] },
        attributes: ["id", "username", "email", "role"],
      },
    ],
  });
  if (group && (!group.permissions || typeof group.permissions !== "object")) {
    group.permissions = {};
  }
  return group;
};

const findGroupByName = async (name, tenantId) => {
  return await Group.findOne({ where: withTenant({ name }, tenantId) });
};

const createGroup = async (groupData, tenantId) => {
  return await Group.create({
    ...groupData,
    ...withTenant({}, tenantId),
  });
};

const updateGroup = async (id, updates, tenantId) => {
  const group = await Group.findOne({
    where: withTenant({ id }, tenantId),
  });
  if (!group) return null;
  return await group.update(updates);
};

const deleteGroup = async (id, tenantId) => {
  const group = await Group.findOne({
    where: withTenant({ id }, tenantId),
  });
  if (!group) return null;
  await group.destroy();
  return true;
};

const addUserToGroup = async (groupId, userId, tenantId) => {
  const group = await Group.findOne({ where: withTenant({ id: groupId }, tenantId) });
  const user = await User.findOne({ where: withTenant({ id: userId }, tenantId) });
  if (!group || !user) return null;
  await user.addGroup(group);
  return await findGroupById(groupId, tenantId);
};

const removeUserFromGroup = async (groupId, userId, tenantId) => {
  const group = await Group.findOne({ where: withTenant({ id: groupId }, tenantId) });
  const user = await User.findOne({ where: withTenant({ id: userId }, tenantId) });
  if (!group || !user) return null;
  await user.removeGroup(group);
  return await findGroupById(groupId, tenantId);
};

const getUsersInGroup = async (groupId, tenantId) => {
  const group = await Group.findOne({
    where: withTenant({ id: groupId }, tenantId),
    include: [
      {
        model: User,
        through: { attributes: [] },
        attributes: ["id", "username", "email", "role"],
      },
    ],
  });
  return group ? group.Users : [];
};

module.exports = {
  findAllGroups,
  findGroupById,
  findGroupByName,
  createGroup,
  updateGroup,
  deleteGroup,
  addUserToGroup,
  removeUserFromGroup,
  getUsersInGroup,
};
