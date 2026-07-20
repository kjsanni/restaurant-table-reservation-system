"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("tenant_notes", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      note: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("tenant_notes", ["tenantId"]);

    await queryInterface.createTable("invoices", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      invoiceNumber: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: "GHS",
      },
      status: {
        type: Sequelize.ENUM("draft", "sent", "paid", "overdue", "cancelled"),
        allowNull: false,
        defaultValue: "draft",
      },
      dueDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      paidAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      lineItems: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
      },
      notes: {
        type: Sequelize.TEXT,
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

    await queryInterface.addIndex("invoices", ["tenantId"]);
    await queryInterface.addIndex("invoices", ["status"]);
    await queryInterface.addIndex("invoices", ["invoiceNumber"], { unique: true });

    await queryInterface.createTable("api_keys", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      keyHash: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      last4: {
        type: Sequelize.STRING(4),
        allowNull: false,
      },
      scopes: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
      },
      lastUsedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      revokedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex("api_keys", ["tenantId"]);
    await queryInterface.addIndex("api_keys", ["keyHash"]);

    await queryInterface.createTable("platform_audit_logs", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      actorUserId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      action: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      entityType: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      entityId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {},
      },
      ipAddress: {
        type: Sequelize.STRING(45),
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("platform_audit_logs", ["actorUserId"]);
    await queryInterface.addIndex("platform_audit_logs", ["tenantId"]);
    await queryInterface.addIndex("platform_audit_logs", ["action"]);
    await queryInterface.addIndex("platform_audit_logs", ["createdAt"]);

    await queryInterface.createTable("notifications", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      type: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      data: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {},
      },
      readAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("notifications", ["userId"]);
    await queryInterface.addIndex("notifications", ["tenantId"]);
    await queryInterface.addIndex("notifications", ["type"]);
    await queryInterface.addIndex("notifications", ["readAt"]);

    await queryInterface.createTable("tenant_onboarding", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
      },
      steps: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
      },
      completedAt: {
        type: Sequelize.DATE,
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

    await queryInterface.addIndex("tenant_onboarding", ["tenantId"]);

    await queryInterface.addColumn("tenants", "gracePeriodDays", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 7,
    });

    await queryInterface.addColumn("tenants", "logoUrl", {
      type: Sequelize.STRING(500),
      allowNull: true,
    });

    await queryInterface.addColumn("tenants", "primaryColor", {
      type: Sequelize.STRING(20),
      allowNull: true,
    });

    await queryInterface.addColumn("tenants", "customDomain", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.addColumn("tenants", "trialExtendsTo", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("tenants", "convertedFromTrialAt", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("tenants", "onboardingCompleted", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addColumn("subscription_plans", "gracePeriodDays", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 7,
    });

    await queryInterface.addColumn("subscription_plans", "features", {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: {},
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("tenant_onboarding");
    await queryInterface.dropTable("notifications");
    await queryInterface.dropTable("platform_audit_logs");
    await queryInterface.dropTable("api_keys");
    await queryInterface.dropTable("invoices");
    await queryInterface.dropTable("tenant_notes");

    await queryInterface.removeColumn("tenants", "gracePeriodDays");
    await queryInterface.removeColumn("tenants", "logoUrl");
    await queryInterface.removeColumn("tenants", "primaryColor");
    await queryInterface.removeColumn("tenants", "customDomain");
    await queryInterface.removeColumn("tenants", "trialExtendsTo");
    await queryInterface.removeColumn("tenants", "convertedFromTrialAt");
    await queryInterface.removeColumn("tenants", "onboardingCompleted");

    await queryInterface.removeColumn("subscription_plans", "gracePeriodDays");
    await queryInterface.removeColumn("subscription_plans", "features");
  },
};
