"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Deliveries", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      orderId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      partnerRef: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      trackingNumber: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: "pending",
      },
      statusDescription: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      customerName: {
        type: Sequelize.STRING(150),
        allowNull: true,
      },
      customerPhone: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      destinationRegion: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      destinationCity: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      destinationAddress: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      destinationPostalCode: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true,
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true,
      },
      packageType: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      handling: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      weight: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      length: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      height: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      value: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      amountToCollect: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      paymentCollector: {
        type: Sequelize.STRING(20),
        allowNull: true,
        defaultValue: "partner",
      },
      paymentStatus: {
        type: Sequelize.STRING(20),
        allowNull: true,
        defaultValue: "unpaid",
      },
      eta: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      maxEta: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      deliveryAttempts: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      trackingHistory: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      callLogs: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      proofPhotoUrl: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      shaqShipmentReference: {
        type: Sequelize.STRING(100),
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

    await queryInterface.addIndex("Deliveries", ["tenantId"]);
    await queryInterface.addIndex("Deliveries", ["orderId"]);
    await queryInterface.addIndex("Deliveries", ["partnerRef"]);
    await queryInterface.addIndex("Deliveries", ["trackingNumber"]);
    await queryInterface.addIndex("Deliveries", ["status"]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("Deliveries");
  },
};
