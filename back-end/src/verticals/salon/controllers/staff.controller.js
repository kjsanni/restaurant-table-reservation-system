"use strict";
const db = require("../../../db/models");
const staffDao = require("../DAOs/staff.dao");
const crypto = require("crypto");

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

const createSalonStaffHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const payload = req.body;
    const staff = await staffDao.create({
      tenantId,
      username: payload.username,
      email: payload.email,
      name: payload.name || payload.username,
      role: "staff",
      password: payload.password || crypto.randomUUID(),
    });
    res.status(201).json({ success: true, data: staff });
  } catch (err) {
    console.error("createSalonStaffHandler error:", err.message);
    res.status(400).json({ success: false, message: err.message || "Failed to create staff" });
  }
};

const updateSalonStaffHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { id } = req.params;
    const payload = req.body;
    const staff = await staffDao.update(id, tenantId, {
      username: payload.username,
      email: payload.email,
      name: payload.name,
    });
    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff not found" });
    }
    res.status(200).json({ success: true, data: staff });
  } catch (err) {
    console.error("updateSalonStaffHandler error:", err.message);
    res.status(400).json({ success: false, message: err.message || "Failed to update staff" });
  }
};

const deleteSalonStaffHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { id } = req.params;
    const removed = await staffDao.delete(id, tenantId);
    if (!removed) {
      return res.status(404).json({ success: false, message: "Staff not found" });
    }
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("deleteSalonStaffHandler error:", err.message);
    res.status(500).json({ success: false, message: "Failed to delete staff" });
  }
};

module.exports = {
  getSalonStaffHandler,
  createSalonStaffHandler,
  updateSalonStaffHandler,
  deleteSalonStaffHandler,
};
