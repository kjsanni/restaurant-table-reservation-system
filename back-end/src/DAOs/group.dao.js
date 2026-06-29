const db = require("../db/models");
const Group = db.group;
const User = db.user;
const { Op } = db.Sequelize;

const findAllGroups = async () => {
  return await Group.findAll({ order: [["id", "ASC"]] });
};

const findGroupById = async (id) => {
  return await Group.findByPk(id, {
    include: [
      {
        model: User,
        through: { attributes: ["id"] },
        attributes: ["id", "username", "email", "role"],
      },
    ],
  });
};

const findGroupByName = async (name) => {
  return await Group.findOne({ where: { name } });
};

const createGroup = async (groupData) => {
  return await Group.create(groupData);
};

const updateGroup = async (id, updates) => {
  const group = await Group.findByPk(id);
  if (!group) return null;
  return await group.update(updates);
};

const deleteGroup = async (id) => {
  const group = await Group.findByPk(id);
  if (!group) return null;
  await group.destroy();
  return true;
};

const addUserToGroup = async (groupId, userId) => {
  const group = await Group.findByPk(groupId);
  const user = await User.findByPk(userId);
  if (!group || !user) return null;
  await user.addGroup(group);
  return await findGroupById(groupId);
};

const removeUserFromGroup = async (groupId, userId) => {
  const group = await Group.findByPk(groupId);
  const user = await User.findByPk(userId);
  if (!group || !user) return null;
  await user.removeGroup(group);
  return await findGroupById(groupId);
};

const getUsersInGroup = async (groupId) => {
  const group = await Group.findByPk(groupId, {
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
