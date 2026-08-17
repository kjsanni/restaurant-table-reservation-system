const db = require("../../db/models");
const platformAuditDAO = require("../DAOs/platformAudit.dao");
const auditLog = require("../utils/auditLog");

const getMaintenanceModeHandler = async (req, res) => {
  const setting = await db.setting.findOne({ where: { key: "maintenance_mode" } });
  res.status(200).json({
    success: true,
    enabled: setting ? setting.value === true || setting.value === "true" : false,
    message: setting?.value?.message || null,
    startedAt: setting?.value?.startedAt || null,
  });
};

const setMaintenanceModeHandler = async (req, res) => {
  const { enabled, message } = req.body;
  const setting = await db.setting.findOne({ where: { key: "maintenance_mode" } });

  const value = {
    enabled: !!enabled,
    message: message || "Platform is under maintenance. Please try again later.",
    startedAt: enabled ? new Date().toISOString() : null,
  };

  if (setting) {
    await setting.update({ value });
  } else {
    await db.setting.create({ key: "maintenance_mode", value });
  }

  await auditLog(req, enabled ? "maintenance.enabled" : "maintenance.disabled", "setting", null, { message: value.message });

  res.status(200).json({ success: true, ...value });
};

module.exports = {
  getMaintenanceModeHandler,
  setMaintenanceModeHandler,
};
