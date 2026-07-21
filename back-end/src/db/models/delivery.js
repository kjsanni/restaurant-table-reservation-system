"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Delivery extends Model {
    static associate(models) {
      Delivery.belongsTo(models.order, {
        foreignKey: "orderId",
        onDelete: "SET NULL",
      });
    }
  }

  Delivery.init(
    {
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      orderId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      partnerRef: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      trackingNumber: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "pending",
      },
      statusDescription: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      customerName: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      customerPhone: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      whatsappSessionId: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      destinationRegion: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      destinationCity: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      destinationAddress: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      destinationPostalCode: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true,
      },
      longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true,
      },
      packageType: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      handling: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      weight: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      length: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      height: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      amountToCollect: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      paymentCollector: {
        type: DataTypes.STRING(20),
        allowNull: true,
        defaultValue: "partner",
      },
      paymentStatus: {
        type: DataTypes.STRING(20),
        allowNull: true,
        defaultValue: "unpaid",
      },
      eta: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      maxEta: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      deliveryAttempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      trackingHistory: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      callLogs: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      proofPhotoUrl: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      shaqShipmentReference: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "delivery",
      tableName: "Deliveries",
    }
  );

  return Delivery;
};
