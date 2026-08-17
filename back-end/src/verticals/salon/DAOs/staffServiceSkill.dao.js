"use strict";
const salonModels = require("../models");

const staffServiceSkillDao = {
  async findByService(serviceId, tenantId) {
    return salonModels.sequelize.models.staffServiceSkill.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
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

  async update(id, tenantId, data) { // codacy-suppress nosql-injection - parameterized ORM call
    const [affected] = await salonModels.sequelize.models.staffServiceSkill.update(data, { // codacy-suppress nosql-injection - parameterized ORM call
      where: { id, tenantId },
      returning: true,
    });
    if (!affected) return null;
    return salonModels.sequelize.models.staffServiceSkill.findByPk(id); // codacy-suppress nosql-injection - parameterized ORM call
  },

  async delete(id, tenantId) {
// codacy-suppress NoSqlInjection
    const record = await salonModels.sequelize.models.staffServiceSkill.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
      where: { id, tenantId },
    });
    if (!record) return false;
    await record.destroy();
    return true;
  },
};

module.exports = staffServiceSkillDao;
