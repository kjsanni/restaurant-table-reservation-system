"use strict";

jest.mock("../db/models", () => {
  const mockDb = {
    tenant: {
      findByPk: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      findOrCreate: jest.fn(),
      destroy: jest.fn(),
    },
    table: {
      count: jest.fn(),
      create: jest.fn(),
      destroy: jest.fn(),
    },
    menuCategory: {
      count: jest.fn(),
      create: jest.fn(),
      destroy: jest.fn(),
    },
    serviceCategory: {
      count: jest.fn(),
      create: jest.fn(),
      destroy: jest.fn(),
      findAll: jest.fn(),
    },
    service: {
      count: jest.fn(),
      create: jest.fn(),
      destroy: jest.fn(),
    },
    location: {
      count: jest.fn(),
      create: jest.fn(),
      destroy: jest.fn(),
    },
    notificationTemplate: {
      findOrCreate: jest.fn(),
      destroy: jest.fn(),
    },
    platformAuditLog: {
      create: jest.fn(),
    },
    sequelize: {
      transaction: jest.fn(async (fn) => fn()),
    },
  };
  return mockDb;
});

const provisioningService = require("../tenant-platform/services/provisioning.service");

describe("Provisioning Service", () => {
  describe("STEPS", () => {
    it("should have ordered provisioning steps", () => {
      const steps = provisioningService.STEPS;
      expect(Array.isArray(steps)).toBe(true);
      expect(steps.length).toBeGreaterThan(0);
      expect(steps[0].key).toBe("seed_type_defaults");
      expect(steps[steps.length - 1].key).toBe("activate_tenant");
    });

    it("each step should have key, label, run, and rollback", () => {
      for (const step of provisioningService.STEPS) {
        expect(typeof step.key).toBe("string");
        expect(typeof step.label).toBe("string");
        expect(typeof step.run).toBe("function");
        expect(typeof step.rollback).toBe("function");
      }
    });
  });

  describe("getProvisioningStatus", () => {
    it("should return null when no pipeline exists", async () => {
      expect(await provisioningService.getProvisioningStatus(999)).toBeNull();
    });
  });

  describe("initialize_erpnext_settings step", () => {
    it("skips when no ERPNext feature flags are enabled", async () => {
      const tenant = {
        id: 1,
        settings: { featureFlags: { loyalty: true } },
        update: jest.fn().mockResolvedValue(true),
      };
      const step = provisioningService.STEPS.find((s) => s.key === "initialize_erpnext_settings");
      await step.run(tenant);
      expect(tenant.update).not.toHaveBeenCalled();
    });

    it("initializes ERPNext settings when flags are present", async () => {
      const tenant = {
        id: 1,
        settings: { featureFlags: { erpnext_accounting: true, erpnext_stock: true } },
        update: jest.fn().mockResolvedValue(true),
      };
      const step = provisioningService.STEPS.find((s) => s.key === "initialize_erpnext_settings");
      await step.run(tenant);
      expect(tenant.update).toHaveBeenCalledWith({
        settings: {
          featureFlags: { erpnext_accounting: true, erpnext_stock: true },
          erpnextOnboardingStatus: { company: "pending", warehouse: "pending", employeeImport: "pending" },
          erpnextConfig: { enabled: true, modules: ["erpnext_accounting", "erpnext_stock"], lastSyncAt: null },
        },
      });
    });
  });

  describe("seed_default_menu_categories step", () => {
    it("skips for non-restaurant tenants", async () => {
      const tenant = { id: 1, businessVertical: "salon", update: jest.fn() };
      const step = provisioningService.STEPS.find((s) => s.key === "seed_default_menu_categories");
      await step.run(tenant);
      expect(tenant.update).not.toHaveBeenCalled();
    });

    it("seeds default categories for restaurant tenants", async () => {
      const mockDb = require("../db/models");
      mockDb.menuCategory.count.mockResolvedValue(0);
      const tenant = { id: 1, businessVertical: "restaurant", update: jest.fn() };
      const step = provisioningService.STEPS.find((s) => s.key === "seed_default_menu_categories");
      await step.run(tenant);
      expect(mockDb.menuCategory.create).toHaveBeenCalledTimes(3);
      expect(mockDb.menuCategory.create).toHaveBeenCalledWith({
        name: "Starters",
        description: "Light bites and appetizers",
        sortOrder: 0,
        tenantId: 1,
      });
    });
  });

  describe("seed_salon_service_categories step", () => {
    it("skips for non-salon tenants", async () => {
      const tenant = { id: 1, businessVertical: "restaurant", update: jest.fn() };
      const step = provisioningService.STEPS.find((s) => s.key === "seed_salon_service_categories");
      await step.run(tenant);
      expect(tenant.update).not.toHaveBeenCalled();
    });

    it("seeds default categories for salon tenants", async () => {
      const mockDb = require("../db/models");
      mockDb.serviceCategory.count.mockResolvedValue(0);
      const tenant = { id: 1, businessVertical: "salon", update: jest.fn() };
      const step = provisioningService.STEPS.find((s) => s.key === "seed_salon_service_categories");
      await step.run(tenant);
      expect(mockDb.serviceCategory.create).toHaveBeenCalledTimes(4);
      expect(mockDb.serviceCategory.create).toHaveBeenCalledWith({
        name: "Hair",
        sortOrder: 0,
        tenantId: 1,
      });
    });
  });

  describe("seed_default_services step", () => {
    it("skips for non-salon tenants", async () => {
      const tenant = { id: 1, businessVertical: "restaurant", update: jest.fn() };
      const step = provisioningService.STEPS.find((s) => s.key === "seed_default_services");
      await step.run(tenant);
      expect(tenant.update).not.toHaveBeenCalled();
    });

    it("seeds default services for salon tenants", async () => {
      const mockDb = require("../db/models");
      mockDb.service.count.mockResolvedValue(0);
      mockDb.serviceCategory.findAll.mockResolvedValue([
        { id: 1, name: "Hair" },
        { id: 2, name: "Nails" },
        { id: 3, name: "Skincare" },
        { id: 4, name: "Massage" },
      ]);
      const tenant = { id: 1, businessVertical: "salon", update: jest.fn() };
      const step = provisioningService.STEPS.find((s) => s.key === "seed_default_services");
      await step.run(tenant);
      expect(mockDb.service.create).toHaveBeenCalledTimes(6);
      expect(mockDb.service.create).toHaveBeenCalledWith({
        tenantId: 1,
        categoryId: 1,
        name: "Men's Haircut",
        price: 50,
        durationMinutes: 30,
        isAvailable: true,
        whatsappBookable: true,
      });
    });
  });

  describe("seed_default_locations step", () => {
    it("skips for non-salon tenants", async () => {
      const tenant = { id: 1, businessVertical: "restaurant", update: jest.fn() };
      const step = provisioningService.STEPS.find((s) => s.key === "seed_default_locations");
      await step.run(tenant);
      expect(tenant.update).not.toHaveBeenCalled();
    });

    it("seeds default location for salon tenants", async () => {
      const mockDb = require("../db/models");
      mockDb.location.count.mockResolvedValue(0);
      const tenant = { id: 1, businessVertical: "salon", currency: "GHS", update: jest.fn() };
      const step = provisioningService.STEPS.find((s) => s.key === "seed_default_locations");
      await step.run(tenant);
      expect(mockDb.location.create).toHaveBeenCalledWith({
        tenantId: 1,
        name: "Main Salon",
        address: "",
        city: "",
        region: "",
        phone: "",
        email: "",
        isPrimary: true,
        isActive: true,
        timezone: "Africa/Accra",
        currency: "GHS",
      });
    });
  });
});
