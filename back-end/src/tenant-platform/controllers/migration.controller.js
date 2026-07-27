const db = require("../../db/models");

const getMigrationStatusHandler = async (req, res) => {
  try {
    const [applied] = await db.sequelize.query("SELECT * FROM SequelizeMeta ORDER BY name ASC");
    const appliedNames = (applied || []).map((row) => row.name);

    const fs = require("fs");
    const path = require("path");
    const migrationsDir = path.join(process.cwd(), "src", "db", "migrations");
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".js")).sort();

    const pending = files.filter((f) => !appliedNames.includes(f));
    const total = files.length;

    res.status(200).json({
      success: true,
      total,
      applied: appliedNames.length,
      pending: pending.length,
      pendingMigrations: pending,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch migration status", error: err.message });
  }
};

module.exports = {
  getMigrationStatusHandler,
};
