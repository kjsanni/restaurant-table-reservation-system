"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const existingTables = new Set(tables.map((t) => t.table_name));

    if (!existingTables.has("template_usage")) {
      await queryInterface.createTable("template_usage", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        templateId: { type: Sequelize.INTEGER, allowNull: false },
        tenantId: { type: Sequelize.INTEGER, allowNull: false },
        appliedBy: { type: Sequelize.INTEGER, allowNull: true },
        source: { type: Sequelize.ENUM("tenant_creation", "manual_apply"), allowNull: false, defaultValue: "manual_apply" },
        appliedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      });

      await queryInterface.addIndex("template_usage", ["tenantId"]);
      await queryInterface.addIndex("template_usage", ["templateId"]);
      await queryInterface.addIndex("template_usage", ["appliedAt"]);
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable("template_usage");
  },
};
