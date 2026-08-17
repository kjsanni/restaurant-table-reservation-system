const db = require("../db/models");
const Group = db.group;
const User = db.user;

const withTenant = (where = {}, tenantId) => (tenantId ? { ...where, tenantId } : where);

const findAllGroups = async (tenantId) => {
  const groups = await Group.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
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
// codacy-suppress NoSqlInjection
  const group = await Group.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
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
  return await Group.findOne({ where: withTenant({ name }, tenantId) }); // codacy-suppress nosql-injection - parameterized ORM call
};

const createGroup = async (groupData, tenantId) => {
  return await Group.create({ // codacy-suppress nosql-injection - parameterized ORM call
    ...groupData,
    ...withTenant({}, tenantId),
  });
};

const updateGroup = async (id, updates, tenantId) => {
  const group = await Group.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
    where: withTenant({ id }, tenantId),
  });
  if (!group) return null;
  return await group.update(updates); // codacy-suppress nosql-injection - parameterized ORM call
};

const deleteGroup = async (id, tenantId) => {
  const group = await Group.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
    where: withTenant({ id }, tenantId),
  });
  if (!group) return null;
  await group.destroy();
  return true;
};

const addUserToGroup = async (groupId, userId, tenantId) => {
  const group = await Group.findOne({ where: withTenant({ id: groupId }, tenantId) }); // codacy-suppress nosql-injection - parameterized ORM call
  const user = await User.findOne({ where: withTenant({ id: userId }, tenantId) }); // codacy-suppress nosql-injection - parameterized ORM call
  if (!group || !user) return null;
  await user.addGroup(group);
  return await findGroupById(groupId, tenantId);
};

const removeUserFromGroup = async (groupId, userId, tenantId) => {
  const group = await Group.findOne({ where: withTenant({ id: groupId }, tenantId) }); // codacy-suppress nosql-injection - parameterized ORM call
  const user = await User.findOne({ where: withTenant({ id: userId }, tenantId) }); // codacy-suppress nosql-injection - parameterized ORM call
  if (!group || !user) return null;
  await user.removeGroup(group);
  return await findGroupById(groupId, tenantId);
};

const getUsersInGroup = async (groupId, tenantId) => {
  const group = await Group.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
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
