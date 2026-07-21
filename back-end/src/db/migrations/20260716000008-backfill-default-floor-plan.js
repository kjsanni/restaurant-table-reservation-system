"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const { sequelize } = queryInterface;

    // Ensure the column is a nullable integer without a string default
    // (earlier schema used the literal 'default' as the column default).
    await queryInterface.changeColumn("Tables", "floorPlanId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null,
    });

    // Create a default "Main Floor" plan if none exists yet.
    const existing = await sequelize.query(
      "SELECT id FROM FloorPlans WHERE name = 'Main Floor' LIMIT 1",
      { type: Sequelize.QueryTypes.SELECT }
    );
    let mainPlanId;
    if (existing && existing.length) {
      mainPlanId = existing[0].id;
    } else {
      const inserted = await sequelize.query(
        "INSERT INTO FloorPlans (name, createdAt, updatedAt) VALUES ('Main Floor', NOW(), NOW())",
        { type: Sequelize.QueryTypes.INSERT }
      );
      const main = await sequelize.query(
        "SELECT id FROM FloorPlans WHERE name = 'Main Floor' LIMIT 1",
        { type: Sequelize.QueryTypes.SELECT }
      );
      mainPlanId = main[0].id;
    }

    // Backfill legacy tables (floorPlanId IS NULL) to the Main Floor plan.
    await sequelize.query(
      "UPDATE Tables SET floorPlanId = ? WHERE floorPlanId IS NULL",
      { replacements: [mainPlanId], type: Sequelize.QueryTypes.UPDATE }
    );
  },

  async down(queryInterface, Sequelize) {
    const { sequelize } = queryInterface;
    await sequelize.query(
      "UPDATE Tables SET floorPlanId = 'default' WHERE floorPlanId IS NOT NULL",
      { type: Sequelize.QueryTypes.UPDATE }
    );
    const [main] = await sequelize.query(
      "SELECT id FROM FloorPlans WHERE name = 'Main Floor' LIMIT 1",
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (main) {
      await sequelize.query("DELETE FROM FloorPlans WHERE id = ?", {
        replacements: [main.id],
        type: Sequelize.QueryTypes.DELETE,
      });
    }
    await queryInterface.changeColumn("Tables", "floorPlanId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: "default",
    });
  },
};
