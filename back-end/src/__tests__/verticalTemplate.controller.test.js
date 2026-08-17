const platformAuditDAO = require("../tenant-platform/DAOs/platformAudit.dao");

jest.mock("../tenant-platform/DAOs/platformAudit.dao", () => ({
  log: jest.fn().mockResolvedValue(),
}));

jest.mock("../db/models", () => {
  const templates = [
    {
      id: 1,
      name: "Full Service Restaurant",
      vertical: "restaurant",
      description: "Complete table reservations",
      defaultSettings: { restaurantType: "full_service" },
      defaultServiceModes: ["dine_in", "takeaway", "delivery"],
      featureFlags: { table_management: true, loyalty: true },
      createdAt: "2026-08-12T00:00:00.000Z",
    },
    {
      id: 2,
      name: "Hair Dressers Salon",
      vertical: "salon",
      description: "Hair cutting and styling",
      defaultSettings: { restaurantType: "hair-dressers" },
      defaultServiceModes: ["appointments", "walkins"],
      featureFlags: { salon_appointments: true, salon_client_profiles: true },
      createdAt: "2026-08-12T00:00:00.000Z",
    },
    {
      id: 14,
      name: "VIP Lounge",
      vertical: "event",
      description: "Exclusive VIP lounge",
      defaultSettings: { restaurantType: "vip_lounge", businessVertical: "event" },
      defaultServiceModes: ["vip_access", "table_reservation", "event_checkin"],
      featureFlags: { event_vip_lounge: true, event_guest_list: true },
      createdAt: "2026-08-12T00:00:00.000Z",
    },
  ];

  const store = {
    _templates: [...templates],
  };

  return {
    __esModule: true,
    __setTemplates: (t) => {
      store._templates = t;
    },
    __getTemplates: () => store._templates,
    setting: {
      findOne: jest.fn().mockImplementation(() => {
        return Promise.resolve({
          value: store._templates,
        });
      }),
      upsert: jest.fn().mockImplementation((record) => {
        const val = typeof record.value === "string" ? JSON.parse(record.value) : record.value;
        store._templates = val;
        return Promise.resolve([record, true]);
      }),
    },
    sequelize: {
      transaction: jest.fn(async (fn) => fn()),
    },
  };
});

const db = require("../db/models");
const controller = require("../tenant-platform/controllers/verticalTemplate.controller");

describe("Vertical Template Controller", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    db.setting.findOne.mockClear();
    db.setting.upsert.mockClear();
    db.__setTemplates([
      {
        id: 1,
        name: "Full Service Restaurant",
        vertical: "restaurant",
        description: "Complete table reservations",
        defaultSettings: { restaurantType: "full_service", businessVertical: "restaurant" },
        defaultServiceModes: ["dine_in", "takeaway", "delivery"],
        featureFlags: { table_management: true, waitlist: true, staff_scheduling: true, loyalty: true, pos_sync: false },
        createdAt: "2026-08-12T00:00:00.000Z",
      },
      {
        id: 2,
        name: "Hair Dressers Salon",
        vertical: "salon",
        description: "Hair cutting and styling",
        defaultSettings: { restaurantType: "hair-dressers", businessVertical: "salon" },
        defaultServiceModes: ["appointments", "walkins"],
        featureFlags: { salon_appointments: true, salon_walkins: true, salon_client_profiles: true, salon_whatsapp_booking: true },
        createdAt: "2026-08-12T00:00:00.000Z",
      },
      {
        id: 14,
        name: "VIP Lounge",
        vertical: "event",
        description: "Exclusive VIP lounge",
        defaultSettings: { restaurantType: "vip_lounge", businessVertical: "event" },
        defaultServiceModes: ["vip_access", "table_reservation", "event_checkin"],
        featureFlags: { event_vip_lounge: true, event_guest_list: true },
        createdAt: "2026-08-12T00:00:00.000Z",
      },
    ]);

    req = { params: {}, body: {}, user: { id: 1 }, ip: "127.0.0.1" };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe("listTemplatesHandler", () => {
    it("returns all templates", async () => {
      await controller.listTemplatesHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        collection: expect.arrayContaining([
          expect.objectContaining({ name: "Full Service Restaurant", vertical: "restaurant" }),
          expect.objectContaining({ name: "Hair Dressers Salon", vertical: "salon" }),
          expect.objectContaining({ name: "VIP Lounge", vertical: "event" }),
        ]),
      });
    });
  });

  describe("createTemplateHandler", () => {
    it("creates a new template with all fields including featureFlags", async () => {
      req.body = {
        name: "Test Salon",
        vertical: "salon",
        description: "A test salon template",
        defaultSettings: { restaurantType: "cafe" },
        defaultServiceModes: ["appointments"],
        featureFlags: { salon_walkins: true },
      };

      await controller.createTemplateHandler(req, res);

      const collection = db.__getTemplates();
      const created = collection.find((t) => t.name === "Test Salon");

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        item: expect.objectContaining({
          id: 15,
          name: "Test Salon",
          vertical: "salon",
          featureFlags: { salon_walkins: true },
        }),
      });
      expect(created).toBeDefined();
      expect(created.defaultServiceModes).toEqual(["appointments"]);
    });

    it("returns 400 when name and vertical are missing", async () => {
      req.body = {};

      await controller.createTemplateHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Name and vertical are required",
      });
    });
  });

  describe("updateTemplateHandler", () => {
    it("updates an existing template with featureFlags", async () => {
      req.params = { id: "1" };
      req.body = {
        name: "Updated Name",
        description: "Updated description",
        defaultSettings: { restaurantType: "quick_service" },
        defaultServiceModes: ["takeaway"],
        featureFlags: { loyalty: false },
      };

      await controller.updateTemplateHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json.mock.calls[0][0].item).toMatchObject({
        id: 1,
        name: "Updated Name",
        vertical: "restaurant",
        featureFlags: { loyalty: false },
        defaultServiceModes: ["takeaway"],
      });
    });

    it("returns 404 for non-existent template", async () => {
      req.params = { id: "999" };

      await controller.updateTemplateHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Template not found",
      });
    });

    it("preserves unchanged fields on partial update", async () => {
      req.params = { id: "1" };
      req.body = { name: "New Name Only" };

      await controller.updateTemplateHandler(req, res);

      const templates = db.__getTemplates();
      const updated = templates.find((t) => t.id === 1);
      expect(updated.name).toBe("New Name Only");
      expect(updated.vertical).toBe("restaurant");
    });
  });

  describe("deleteTemplateHandler", () => {
    it("deletes an existing template", async () => {
      req.params = { id: "1" };

      await controller.deleteTemplateHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true });
      const templates = db.__getTemplates();
      expect(templates.find((t) => t.id === 1)).toBeUndefined();
    });

    it("returns 404 for non-existent template", async () => {
      req.params = { id: "999" };

      await controller.deleteTemplateHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("audit logging", () => {
    it("logs template creation", async () => {
      req.body = { name: "Audit Test", vertical: "salon" };

      await controller.createTemplateHandler(req, res);

      expect(platformAuditDAO.log).toHaveBeenCalledWith(
        1,
        "tenant.template_created",
        "setting",
        15,
        null,
        expect.objectContaining({ name: "Audit Test", vertical: "salon" }),
        "127.0.0.1"
      );
    });

    it("logs template update", async () => {
      req.params = { id: "1" };
      req.body = { name: "Updated" };

      await controller.updateTemplateHandler(req, res);

      expect(platformAuditDAO.log).toHaveBeenCalledWith(
        1,
        "tenant.template_updated",
        "setting",
        1,
        null,
        expect.objectContaining({ name: "Updated" }),
        "127.0.0.1"
      );
    });

    it("logs template deletion", async () => {
      req.params = { id: "1" };

      await controller.deleteTemplateHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("cloneTemplateHandler", () => {
    it("clones a template with '(Copy)' suffix", async () => {
      req.params = { id: "1" };

      await controller.cloneTemplateHandler(req, res);

      const templates = db.__getTemplates();
      const clone = templates.find((t) => t.name === "Full Service Restaurant (Copy)");
      expect(res.status).toHaveBeenCalledWith(201);
      expect(clone).toBeDefined();
      expect(clone.id).toBe(15);
      expect(clone.vertical).toBe("restaurant");
      expect(clone.featureFlags).toEqual({ table_management: true, waitlist: true, staff_scheduling: true, loyalty: true, pos_sync: false });
    });

    it("returns 404 for non-existent template", async () => {
      req.params = { id: "999" };

      await controller.cloneTemplateHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Template not found",
      });
    });

    it("logs template clone", async () => {
      req.params = { id: "1" };

      await controller.cloneTemplateHandler(req, res);

      expect(platformAuditDAO.log).toHaveBeenCalledWith(
        1,
        "tenant.template_cloned",
        "setting",
        15,
        null,
        expect.objectContaining({ sourceName: "Full Service Restaurant" }),
        "127.0.0.1"
      );
    });
  });

  describe("getTemplateUsageHandler", () => {
    it("returns empty collection when no db.templateUsage model", async () => {
      req.params = {};

      await controller.getTemplateUsageHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        collection: [],
        summary: { totalApplications: 0 },
      });
    });
  });

  describe("getTemplateById", () => {
    it("finds a template by ID", async () => {
      const template = await controller.getTemplateById(1);
      expect(template.name).toBe("Full Service Restaurant");
    });

    it("returns undefined for non-existent ID", async () => {
      const template = await controller.getTemplateById(999);
      expect(template).toBeUndefined();
    });
  });
});
