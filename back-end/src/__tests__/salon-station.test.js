"use strict";

jest.mock("../verticals/salon/DAOs/station.dao");

const stationController = require("../verticals/salon/controllers/station.controller");

describe("station.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getAllStations returns 200 with tenant-scoped results", async () => {
    require("../verticals/salon/DAOs/station.dao").findAllForTenant.mockResolvedValue({
      total: 3,
      data: [{ id: 1, name: "Chair 1" }, { id: 2, name: "Wash 1" }],
    });

    const req = {
      tenant: { id: 1 },
      query: {},
    };
    const res = {
      json: jest.fn(),
    };

    await stationController.getAllStations(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      total: 3,
      data: [{ id: 1, name: "Chair 1" }, { id: 2, name: "Wash 1" }],
    });
    expect(require("../verticals/salon/DAOs/station.dao").findAllForTenant).toHaveBeenCalledWith(1, {});
  });

  it("getStationUtilization returns correct percent", async () => {
    require("../verticals/salon/DAOs/station.dao").findById.mockResolvedValue({ id: 1 });
    require("../verticals/salon/DAOs/station.dao").getUtilization.mockResolvedValue({
      utilizationPercent: 75,
      occupiedCount: 4,
      totalCount: 8,
    });

    const req = {
      tenant: { id: 1 },
      params: { id: 1 },
      query: { start: "2026-07-22", end: "2026-07-23" },
    };
    const res = {
      json: jest.fn(),
    };

    await stationController.getStationUtilization(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { utilizationPercent: 75, occupiedCount: 4, totalCount: 8 },
    });
  });

  it("createStation returns 201 with new station", async () => {
    require("../verticals/salon/DAOs/station.dao").create.mockResolvedValue({
      id: 1,
      name: "New Chair",
      type: "chair",
    });

    const req = {
      tenant: { id: 1 },
      body: { name: "New Chair", type: "chair" },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await stationController.createStation(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { id: 1, name: "New Chair", type: "chair" },
    });
  });
});
