const db = require("../db/models");
const Role = db.role;
const { Op } = db.Sequelize;

const withTenant = (where = {}, tenantId) => (tenantId ? { ...where, tenantId } : where);

const normalizePermissions = (permissions) => {
  if (!permissions) return {};
  if (typeof permissions === "string") {
    try {
      const parsed = JSON.parse(permissions);
      if (typeof parsed === "object" && parsed !== null) return parsed;
    } catch {}
  }
  if (typeof permissions === "object" && permissions !== null) return permissions;
  return {};
};

const findAllRoles = async (tenantId) => {
  const roles = await Role.findAll({
    where: withTenant({}, tenantId),
    order: [["id", "ASC"]],
  });
  return roles.map((r) => {
    r.permissions = normalizePermissions(r.permissions);
    return r;
  });
};

const findRoleById = async (id, tenantId) => {
  const role = await Role.findOne({
    where: withTenant({ id }, tenantId),
  });
  if (role) {
    role.permissions = normalizePermissions(role.permissions);
  }
  return role;
};

const findRoleByName = async (name, tenantId) => {
  const role = await Role.findOne({ where: withTenant({ name }, tenantId) });
  if (role) {
    role.permissions = normalizePermissions(role.permissions);
  }
  return role;
};

const createRole = async (roleData, tenantId) => {
  return await Role.create({
    ...roleData,
    ...withTenant({}, tenantId),
  });
};

const updateRole = async (id, updates, tenantId) => {
  const role = await Role.findOne({
    where: withTenant({ id }, tenantId),
  });
  if (!role) return null;
  return await role.update(updates);
};

const deleteRole = async (id, tenantId) => {
  const role = await Role.findOne({
    where: withTenant({ id }, tenantId),
  });
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
      const groupPerms = normalizePermissions(group.permissions);
      Object.assign(mergedPermissions, groupPerms);
    });
  }

  const userPerms = normalizePermissions(user.permissions);
  if (Object.keys(userPerms).length > 0) {
    Object.assign(mergedPermissions, userPerms);
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
