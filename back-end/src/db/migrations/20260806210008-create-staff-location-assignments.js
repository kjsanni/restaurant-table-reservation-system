"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("staff_location_assignments", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
        userId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "users", key: "id" },
          onDelete: "CASCADE",
        },
      locationId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "locations", key: "id" },
        onDelete: "CASCADE",
      },
      isPrimary: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
    await queryInterface.addIndex("staff_location_assignments", ["tenantId"]);
    await queryInterface.addIndex("staff_location_assignments", ["userId"]);
    await queryInterface.addIndex("staff_location_assignments", ["locationId"]);
    await queryInterface.addIndex("staff_location_assignments", ["userId", "locationId"], {
      unique: true,
      name: "unique_user_location",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("staff_location_assignments", ["userId", "locationId"]);
    await queryInterface.removeIndex("staff_location_assignments", ["locationId"]);
    await queryInterface.removeIndex("staff_location_assignments", ["userId"]);
    await queryInterface.removeIndex("staff_location_assignments", ["tenantId"]);
    await queryInterface.dropTable("staff_location_assignments");
  },
};
