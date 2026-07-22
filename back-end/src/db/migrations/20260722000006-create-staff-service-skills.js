"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("staff_service_skills", {
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
        onUpdate: "cascade",
        onDelete: "cascade",
      },
      serviceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "services", key: "id" },
        onUpdate: "cascade",
        onDelete: "cascade",
      },
      skillLevel: {
        type: Sequelize.ENUM("trainee", "proficient", "expert"),
        allowNull: false,
        defaultValue: "proficient",
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

    await queryInterface.addIndex("staff_service_skills", ["tenantId"]);
    await queryInterface.addIndex("staff_service_skills", ["tenantId", "userId"]);
    await queryInterface.addIndex("staff_service_skills", ["tenantId", "serviceId"]);
    await queryInterface.addIndex("staff_service_skills", ["userId", "serviceId"], {
      unique: true,
      name: "unique_staff_service_per_tenant",
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("staff_service_skills");
  },
};
