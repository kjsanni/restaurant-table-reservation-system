"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("salon_client_profiles", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      customerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: "unique_salon_client_per_tenant",
        references: { model: "customers", key: "id" },
        onUpdate: "cascade",
        onDelete: "cascade",
      },
      hairType: {
        type: Sequelize.ENUM(
          "straight",
          "wavy",
          "curly",
          "coily",
          "locs",
          "braided",
          "short_cropped",
          "no_preference"
        ),
        allowNull: true,
      },
      preferredStylistId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "users", key: "id" },
        onUpdate: "cascade",
        onDelete: "set null",
      },
      paymentPreference: {
        type: Sequelize.ENUM("cash_at_salon", "card_paystack", "whatsapp_momo"),
        allowNull: true,
      },
      whatsappBookingEnabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      birthday: {
        type: Sequelize.DATEONLY,
        allowNull: true,
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

    await queryInterface.addIndex("salon_client_profiles", ["tenantId"]);
    await queryInterface.addIndex("salon_client_profiles", ["tenantId", "customerId"], {
      unique: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("salon_client_profiles");
  },
};
