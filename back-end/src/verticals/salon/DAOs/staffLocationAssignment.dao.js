"use strict";
const db = require("../../../db/models");

const staffLocationAssignmentDAO = {
  async findAllForTenant(tenantId, filters = {}) {
    const where = { tenantId };

    if (filters.userId) where.userId = filters.userId;
    if (filters.locationId) where.locationId = filters.locationId;

    return db.staffLocationAssignment.findAll({
      where,
      include: [
        {
          model: db.user,
          as: "user",
          attributes: ["id", "username", "email", "role"],
        },
        {
          model: db.location,
          as: "location",
          attributes: ["id", "name"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: filters.limit || 100,
      offset: filters.offset || 0,
    });
  },

  async findById(id, tenantId) {
    const numericId = Number(id);
    const numericTenantId = Number(tenantId);
    if (!Number.isInteger(numericId) || !Number.isInteger(numericTenantId)) {
      return null;
    }
    // codacy-suppress NoSqlInjection Sequelize ORM uses parameterized queries; numericId and numericTenantId are validated integers
    return db.staffLocationAssignment.findOne({
      where: { id: numericId, tenantId: numericTenantId },
      include: [
        {
          model: db.user,
          as: "user",
          attributes: ["id", "username", "email", "role"],
        },
        {
          model: db.location,
          as: "location",
          attributes: ["id", "name"],
        },
      ],
    });
  },

  async findByUserLocation(userId, locationId, tenantId) {
    const numericUserId = Number(userId);
    const numericLocationId = Number(locationId);
    const numericTenantId = Number(tenantId);
    if (!Number.isInteger(numericUserId) || !Number.isInteger(numericLocationId) || !Number.isInteger(numericTenantId)) {
      return null;
    }
    // codacy-suppress NoSqlInjection Sequelize ORM uses parameterized queries; all IDs are validated integers
    return db.staffLocationAssignment.findOne({
      where: { userId: numericUserId, locationId: numericLocationId, tenantId: numericTenantId },
    });
  },

  async create(data, tenantId) {
    return db.staffLocationAssignment.create({ ...data, tenantId });
  },

  async update(id, tenantId, updates) {
    const numericId = Number(id);
    const numericTenantId = Number(tenantId);
    if (!Number.isInteger(numericId) || !Number.isInteger(numericTenantId)) {
      return null;
    }
    const assignment = await db.staffLocationAssignment.findOne({
      where: { id: numericId, tenantId: numericTenantId },
    });
    if (!assignment) return null;
    await assignment.update(updates);
    return assignment;
  },

  async delete(id, tenantId) {
    const numericId = Number(id);
    const numericTenantId = Number(tenantId);
    if (!Number.isInteger(numericId) || !Number.isInteger(numericTenantId)) {
      return false;
    }
    const assignment = await db.staffLocationAssignment.findOne({
      where: { id: numericId, tenantId: numericTenantId },
    });
    if (!assignment) return false;
    await assignment.destroy();
    return true;
  },
};

module.exports = staffLocationAssignmentDAO;
