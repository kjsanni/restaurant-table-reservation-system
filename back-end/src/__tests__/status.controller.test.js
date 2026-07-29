const statusController = require("../controllers/status.controller");

jest.mock("../db/models", () => ({
  sequelize: {
    authenticate: jest.fn(),
  },
  Sequelize: {
    Op: { gte: "gte" },
  },
  incident: {
    findAndCountAll: jest.fn(),
  },
}));

jest.mock("../queues/queue", () => ({
  isRedisAvailable: jest.fn(),
}));

const db = require("../db/models");
const { isRedisAvailable } = require("../queues/queue");

describe("status.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.sequelize.authenticate.mockResolvedValue();
    isRedisAvailable.mockResolvedValue(true);
    db.incident.findAndCountAll.mockResolvedValue({
      count: 0,
      rows: [],
    });
  });

  it("returns operational when all checks are healthy", async () => {
    const req = {};
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);

    await statusController.getPublicStatusHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        status: "operational",
      })
    );
  });

  it("returns degraded when database is unhealthy", async () => {
    db.sequelize.authenticate.mockRejectedValue(new Error("db down"));
    const req = {};
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);

    await statusController.getPublicStatusHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "degraded",
      })
    );
  });

  it("returns degraded when redis is unavailable", async () => {
    isRedisAvailable.mockResolvedValue(false);
    const req = {};
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);

    await statusController.getPublicStatusHandler(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "degraded",
      })
    );
  });
});
