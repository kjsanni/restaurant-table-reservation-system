"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const hasColumn = await queryInterface.describeTable("platform_audit_logs").then(
      (cols) => cols.createdAt !== undefined,
      () => false
    );

    if (!hasColumn) {
      await queryInterface.addColumn("platform_audit_logs", "createdAt", {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("platform_audit_logs", "createdAt");
  },
};
