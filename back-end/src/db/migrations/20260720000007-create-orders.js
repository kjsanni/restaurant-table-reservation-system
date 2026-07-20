"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Orders", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "tenants", key: "id" },
        onDelete: "SET NULL",
      },
      customerId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "Customers", key: "id" },
        onDelete: "SET NULL",
      },
      reservationId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "Reservations", key: "id" },
        onDelete: "SET NULL",
      },
      status: {
        type: Sequelize.ENUM(
          "draft",
          "submitted",
          "confirmed",
          "preparing",
          "ready",
          "completed",
          "cancelled"
        ),
        allowNull: false,
        defaultValue: "draft",
      },
      paymentStatus: {
        type: Sequelize.ENUM("unpaid", "deposit", "partial", "paid", "refunded"),
        allowNull: false,
        defaultValue: "unpaid",
      },
      total: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      orderedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdBy: {
        type: Sequelize.STRING(50),
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

    await queryInterface.addIndex("Orders", ["tenantId"], {
      name: "orders_tenant_id",
    });
    await queryInterface.addIndex("Orders", ["customerId"], {
      name: "orders_customer_id",
    });
    await queryInterface.addIndex("Orders", ["reservationId"], {
      name: "orders_reservation_id",
    });
    await queryInterface.addIndex("Orders", ["status"], {
      name: "orders_status",
    });
    await queryInterface.addIndex("Orders", ["paymentStatus"], {
      name: "orders_payment_status",
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("Orders");
  },
};
