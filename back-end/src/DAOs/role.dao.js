const db = require("../db/models");
const Role = db.role;
const { Op } = db.Sequelize;

const findAllRoles = async () => {
  const roles = await Role.findAll({ order: [["id", "ASC"]] });
  return roles.map((r) => {
    if (!r.permissions || typeof r.permissions !== "object") {
      r.permissions = {};
    }
    return r;
  });
};

const findRoleById = async (id) => {
  const role = await Role.findByPk(id);
  if (role && (!role.permissions || typeof role.permissions !== "object")) {
    role.permissions = {};
  }
  return role;
};

const findRoleByName = async (name) => {
  return await Role.findOne({ where: { name } });
};

const createRole = async (roleData) => {
  return await Role.create(roleData);
};

const updateRole = async (id, updates) => {
  const role = await Role.findByPk(id);
  if (!role) return null;
  return await role.update(updates);
};

const deleteRole = async (id) => {
  const role = await Role.findByPk(id);
  if (!role) return null;
  if (role.isSystem) {
    throw { status: 400, message: "Cannot delete a system role!" };
  }
  await role.destroy();
  return true;
};

const getRolePermissions = async (userId) => {
  const user = await db.user.findByPk(userId, {
    include: [
      {
        model: db.group,
        through: { attributes: [] },
      },
    ],
  });

  if (!user) return null;

  const mergedPermissions = {};

  const role = await findRoleByName(user.role);
  if (role && role.permissions) {
    Object.assign(mergedPermissions, role.permissions);
  }

  if (user.groups && user.groups.length > 0) {
    user.groups.forEach((group) => {
      if (group.permissions) {
        Object.assign(mergedPermissions, group.permissions);
      }
    });
  }

  if (user.permissions) {
    Object.assign(mergedPermissions, user.permissions);
  }

  return mergedPermissions;
};

module.exports = {
  findAllRoles,
  findRoleById,
  findRoleByName,
  createRole,
  updateRole,
  deleteRole,
  getRolePermissions,
};
