"use strict";
const db = require("../../../db/models");
const Op = db.Sequelize.Op;

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
    return db.staffLocationAssignment.findOne({
      where: { id, tenantId },
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
    return db.staffLocationAssignment.findOne({
      where: { userId, locationId, tenantId },
    });
  },

  async create(data, tenantId) {
    return db.staffLocationAssignment.create({ ...data, tenantId });
  },

  async update(id, tenantId, updates) {
    const assignment = await db.staffLocationAssignment.findOne({
      where: { id, tenantId },
    });
    if (!assignment) return null;
    await assignment.update(updates);
    return assignment;
  },

  async delete(id, tenantId) {
    const assignment = await db.staffLocationAssignment.findOne({
      where: { id, tenantId },
    });
    if (!assignment) return false;
    await assignment.destroy();
    return true;
  },
};

module.exports = staffLocationAssignmentDAO;
