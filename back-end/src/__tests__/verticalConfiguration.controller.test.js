const {
  listVerticalConfigurationsHandler,
  getVerticalConfigurationHandler,
  createVerticalConfigurationHandler,
  updateVerticalConfigurationHandler,
  deleteVerticalConfigurationHandler,
  getVerticalConfigurationSummaryHandler,
} = require("../tenant-platform/controllers/verticalConfiguration.controller");

jest.mock("../tenant-platform/DAOs/verticalConfiguration.dao", () => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  findByVerticalAndType: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  count: jest.fn(),
}));

jest.mock("../tenant-platform/DAOs/platformAudit.dao", () => ({
  log: jest.fn(() => Promise.resolve()),
}));

const verticalConfigurationDAO = require("../tenant-platform/DAOs/verticalConfiguration.dao");
const platformAuditDAO = require("../tenant-platform/DAOs/platformAudit.dao");
const { createRes } = require("./utils/test-response");

function createReq(user = { id: 1 }, overrides = {}) {
  return {
    user,
    ip: "127.0.0.1",
    params: {},
    query: {},
    body: {},
    ...overrides,
  };
}

describe("verticalConfiguration.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("listVerticalConfigurationsHandler", () => {
    it("returns list of configurations", async () => {
      const mockConfigs = [
        { id: 1, vertical: "restaurant", useCaseType: "full_service", name: "Full Service", isActive: true },
        { id: 2, vertical: "salon", useCaseType: "hair-dressers", name: "Hair Salon", isActive: true },
      ];
      verticalConfigurationDAO.findAll.mockResolvedValue(mockConfigs);

      const req = createReq();
      const res = createRes();
      await listVerticalConfigurationsHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, collection: mockConfigs });
      expect(verticalConfigurationDAO.findAll).toHaveBeenCalledWith({});
    });

    it("filters by vertical", async () => {
      verticalConfigurationDAO.findAll.mockResolvedValue([]);
      const req = createReq({}, { query: { vertical: "salon" } });
      const res = createRes();
      await listVerticalConfigurationsHandler(req, res);
      expect(verticalConfigurationDAO.findAll).toHaveBeenCalledWith({ vertical: "salon" });
    });

    it("filters by isActive", async () => {
      verticalConfigurationDAO.findAll.mockResolvedValue([]);
      const req = createReq({}, { query: { isActive: "true" } });
      const res = createRes();
      await listVerticalConfigurationsHandler(req, res);
      expect(verticalConfigurationDAO.findAll).toHaveBeenCalledWith({ isActive: true });
    });
  });

  describe("getVerticalConfigurationHandler", () => {
    it("returns configuration by id", async () => {
      const mockConfig = { id: 1, vertical: "restaurant", useCaseType: "full_service", name: "Full Service" };
      verticalConfigurationDAO.findById.mockResolvedValue(mockConfig);

      const req = createReq({}, { params: { id: "1" } });
      const res = createRes();
      await getVerticalConfigurationHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, item: mockConfig });
      expect(verticalConfigurationDAO.findById).toHaveBeenCalledWith(1);
    });

    it("returns 404 when not found", async () => {
      verticalConfigurationDAO.findById.mockResolvedValue(null);
      const req = createReq({}, { params: { id: "999" } });
      const res = createRes();
      await getVerticalConfigurationHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("createVerticalConfigurationHandler", () => {
    it("creates configuration and logs audit", async () => {
      const mockConfig = { id: 1, vertical: "salon", useCaseType: "hair-dressers", name: "Hair Salon" };
      verticalConfigurationDAO.findByVerticalAndType.mockResolvedValue(null);
      verticalConfigurationDAO.create.mockResolvedValue(mockConfig);

      const req = createReq({ id: 1 }, {
        body: {
          vertical: "salon",
          useCaseType: "hair-dressers",
          name: "Hair Salon",
          featureFlags: { salon_appointments: true },
          serviceModes: ["appointments", "walkins"],
        },
      });
      const res = createRes();
      await createVerticalConfigurationHandler(req, res);

      expect(verticalConfigurationDAO.create).toHaveBeenCalledWith({
        vertical: "salon",
        useCaseType: "hair-dressers",
        name: "Hair Salon",
        description: "",
        featureFlags: { salon_appointments: true },
        serviceModes: ["appointments", "walkins"],
        allowedIntegrations: [],
        uiComponents: {},
        breakglassRequired: true,
        isActive: true,
      });
      expect(platformAuditDAO.log).toHaveBeenCalledWith(
        1,
        "vertical_configuration.created",
        "vertical_configuration",
        1,
        null,
        { vertical: "salon", useCaseType: "hair-dressers", name: "Hair Salon" },
        "127.0.0.1"
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("returns 400 when vertical is missing", async () => {
      const req = createReq({ id: 1 }, { body: { useCaseType: "x", name: "Test" } });
      const res = createRes();
      await createVerticalConfigurationHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 400 when useCaseType is missing", async () => {
      const req = createReq({ id: 1 }, { body: { vertical: "restaurant", name: "Test" } });
      const res = createRes();
      await createVerticalConfigurationHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 409 when duplicate exists", async () => {
      verticalConfigurationDAO.findByVerticalAndType.mockResolvedValue({ id: 1 });
      const req = createReq({ id: 1 }, { body: { vertical: "restaurant", useCaseType: "full_service", name: "Test" } });
      const res = createRes();
      await createVerticalConfigurationHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  describe("updateVerticalConfigurationHandler", () => {
    it("updates configuration and logs audit", async () => {
      const existing = { id: 1, vertical: "restaurant", useCaseType: "full_service", name: "Old Name" };
      verticalConfigurationDAO.findById.mockResolvedValue(existing);
      verticalConfigurationDAO.update.mockResolvedValue({ ...existing, name: "New Name" });

      const req = createReq({ id: 1 }, { params: { id: "1" }, body: { name: "New Name" } });
      const res = createRes();
      await updateVerticalConfigurationHandler(req, res);

      expect(verticalConfigurationDAO.update).toHaveBeenCalledWith(1, { name: "New Name" });
      expect(platformAuditDAO.log).toHaveBeenCalledWith(
        1,
        "vertical_configuration.updated",
        "vertical_configuration",
        1,
        null,
        { vertical: "restaurant", useCaseType: "full_service" },
        "127.0.0.1"
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 404 when not found", async () => {
      verticalConfigurationDAO.findById.mockResolvedValue(null);
      const req = createReq({ id: 1 }, { params: { id: "999" }, body: { name: "New" } });
      const res = createRes();
      await updateVerticalConfigurationHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("deleteVerticalConfigurationHandler", () => {
    it("deletes configuration and logs audit", async () => {
      const existing = { id: 1, vertical: "restaurant", useCaseType: "full_service", name: "Test" };
      verticalConfigurationDAO.findById.mockResolvedValue(existing);
      verticalConfigurationDAO.remove.mockResolvedValue(existing);

      const req = createReq({ id: 1 }, { params: { id: "1" } });
      const res = createRes();
      await deleteVerticalConfigurationHandler(req, res);

      expect(verticalConfigurationDAO.remove).toHaveBeenCalledWith(1);
      expect(platformAuditDAO.log).toHaveBeenCalledWith(
        1,
        "vertical_configuration.deleted",
        "vertical_configuration",
        1,
        null,
        { vertical: "restaurant", useCaseType: "full_service", name: "Test" },
        "127.0.0.1"
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 404 when not found", async () => {
      verticalConfigurationDAO.findById.mockResolvedValue(null);
      const req = createReq({ id: 1 }, { params: { id: "999" } });
      const res = createRes();
      await deleteVerticalConfigurationHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("getVerticalConfigurationSummaryHandler", () => {
    it("returns summary array", async () => {
      const mockConfigs = [
        { id: 1, vertical: "restaurant", useCaseType: "full_service", name: "Full Service", isActive: true, breakglassRequired: true, featureFlags: { a: true }, serviceModes: ["a"], allowedIntegrations: ["b"] },
      ];
      verticalConfigurationDAO.findAll.mockResolvedValue(mockConfigs);

      const req = createReq();
      const res = createRes();
      await getVerticalConfigurationSummaryHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        collection: [
          { id: 1, vertical: "restaurant", useCaseType: "full_service", name: "Full Service", isActive: true, breakglassRequired: true, featureCount: 1, serviceModeCount: 1, integrationCount: 1 },
        ],
      });
    });
  });
});
