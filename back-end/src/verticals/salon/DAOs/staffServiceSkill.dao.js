"use strict";
const salonModels = require("../models");

const staffServiceSkillDao = {
  async findByService(serviceId, tenantId) {
    return salonModels.sequelize.models.staffServiceSkill.findAll({
      where: { serviceId, tenantId },
      include: [
        {
          model: salonModels.sequelize.models.user,
          as: "user",
          attributes: ["id", "username", "email"],
        },
      ],
      order: [["skillLevel", "DESC"], ["id", "ASC"]],
    });
  },

  async findOrCreate(data) {
    return salonModels.sequelize.models.staffServiceSkill.findOrCreate({
      where: { userId: data.userId, serviceId: data.serviceId, tenantId: data.tenantId },
      defaults: data,
    });
  },

  async update(id, tenantId, data) {
    const [affected] = await salonModels.sequelize.models.staffServiceSkill.update(data, {
      where: { id, tenantId },
      returning: true,
    });
    if (!affected) return null;
    return salonModels.sequelize.models.staffServiceSkill.findByPk(id);
  },

  async delete(id, tenantId) {
    const record = await salonModels.sequelize.models.staffServiceSkill.findOne({
      where: { id, tenantId },
    });
    if (!record) return false;
    await record.destroy();
    return true;
  },
};

module.exports = staffServiceSkillDao;
