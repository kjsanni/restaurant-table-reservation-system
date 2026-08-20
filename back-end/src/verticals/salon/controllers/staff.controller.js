"use strict";
const db = require("../../../db/models");
const staffDao = require("../DAOs/staff.dao");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const getSalonStaffHandler = async (req, res) => {
  const tenantId = req.tenant?.id;
  const staff = await staffDao.findAllForTenant(tenantId, req.query);

  const staffIds = staff.map((u) => u.id);
  const allSkills = await db.sequelize.models.staffServiceSkill.findAll({
    where: { userId: staffIds },
    include: [
      {
        model: db.sequelize.models.service,
        as: "service",
        attributes: ["id", "name"],
      },
    ],
  });

  const skillsByUser = {};
  allSkills.forEach((ss) => {
    if (!skillsByUser[ss.userId]) skillsByUser[ss.userId] = [];
    skillsByUser[ss.userId].push(ss);
  });

  const formatted = staff.map((user) => ({
    id: user.id,
    username: user.username,
    email: user.email,
    skills: (skillsByUser[user.id] || []).map((ss) => ({
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
    const plainPassword = payload.password || crypto.randomUUID();
    const hashedPassword = await bcrypt.hash(plainPassword, 12);
    const staff = await staffDao.create({
      tenantId,
      username: payload.username,
      email: payload.email,
      name: payload.name || payload.username,
      role: "staff",
      password: hashedPassword,
      phone: payload.phone || null,
    });
    const { password: _pw, ...safeStaff } = staff.toJSON ? staff.toJSON() : staff;
    res.status(201).json({ success: true, data: safeStaff });
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
      phone: payload.phone,
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
