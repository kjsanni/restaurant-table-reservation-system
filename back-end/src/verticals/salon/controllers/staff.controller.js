const db = require("../../db/models");

const getSalonStaffHandler = async (req, res) => {
  const tenantId = req.tenant?.id;
  const staff = await db.user.findAll({
    where: { tenantId, role: "staff" },
    attributes: ["id", "username", "email", "name"],
    include: [
      {
        model: db.sequelize.models.staffServiceSkill,
        as: "staffServiceSkills",
        include: [
          {
            model: db.sequelize.models.service,
            as: "service",
            attributes: ["id", "name"],
          },
        ],
      },
    ],
    order: [["username", "ASC"]],
  });

  const formatted = staff.map((user) => ({
    id: user.id,
    username: user.username,
    email: user.email,
    skills: (user.staffServiceSkills || []).map((ss) => ({
      serviceId: ss.serviceId,
      skillLevel: ss.skillLevel,
      service: ss.service,
    })),
  }));

  res.status(200).json({ success: true, data: formatted });
};

module.exports = {
  getSalonStaffHandler,
};
