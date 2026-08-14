"use strict";

jest.mock("../verticals/salon/DAOs/staff.dao");

const db = require("../db/models");
jest.spyOn(db.sequelize.models.staffServiceSkill, "findAll").mockResolvedValue([]);

const staffController = require("../verticals/salon/controllers/staff.controller");

describe("staff.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getSalonStaff returns 200 with tenant-scoped staff", async () => {
    const mockUser = { id: 1, username: "efua", email: "efua@example.com" };
    require("../verticals/salon/DAOs/staff.dao").findAllForTenant.mockResolvedValue([mockUser]);
    require("../verticals/salon/DAOs/staff.dao").findById.mockResolvedValue(mockUser);

    const req = {
      tenant: { id: 1 },
      query: {},
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await staffController.getSalonStaffHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [{ id: 1, username: "efua", email: "efua@example.com", skills: [] }],
    });
    expect(require("../verticals/salon/DAOs/staff.dao").findAllForTenant).toHaveBeenCalledWith(1, {});
  });

  it("createSalonStaff returns 201 with new staff", async () => {
    require("../verticals/salon/DAOs/staff.dao").create.mockResolvedValue({
      id: 2,
      username: "newstaff",
      email: "new@example.com",
      role: "staff",
    });

    const req = {
      tenant: { id: 1 },
      body: { username: "newstaff", email: "new@example.com", name: "New Staff" },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await staffController.createSalonStaffHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { id: 2, username: "newstaff", email: "new@example.com", role: "staff" },
    });
  });

  it("updateSalonStaff returns 200 with updated staff", async () => {
    require("../verticals/salon/DAOs/staff.dao").findById.mockResolvedValue({
      id: 1,
      username: "efua",
      email: "efua@example.com",
    });
    require("../verticals/salon/DAOs/staff.dao").update.mockResolvedValue({
      id: 1,
      username: "efua",
      email: "efua.new@example.com",
    });

    const req = {
      tenant: { id: 1 },
      params: { id: 1 },
      body: { email: "efua.new@example.com" },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await staffController.updateSalonStaffHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { id: 1, username: "efua", email: "efua.new@example.com" },
    });
  });

  it("updateSalonStaff returns 404 when staff not found", async () => {
    require("../verticals/salon/DAOs/staff.dao").findById.mockResolvedValue(null);
    require("../verticals/salon/DAOs/staff.dao").update.mockResolvedValue(null);

    const req = {
      tenant: { id: 1 },
      params: { id: 1 },
      body: { email: "efua.new@example.com" },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await staffController.updateSalonStaffHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Staff not found" });
  });

  it("deleteSalonStaff returns 200 when deleted", async () => {
    require("../verticals/salon/DAOs/staff.dao").findById.mockResolvedValue({
      id: 1,
      username: "efua",
    });
    require("../verticals/salon/DAOs/staff.dao").delete.mockResolvedValue(true);

    const req = {
      tenant: { id: 1 },
      params: { id: 1 },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await staffController.deleteSalonStaffHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it("deleteSalonStaff returns 404 when staff not found", async () => {
    require("../verticals/salon/DAOs/staff.dao").findById.mockResolvedValue(null);
    require("../verticals/salon/DAOs/staff.dao").delete.mockResolvedValue(false);

    const req = {
      tenant: { id: 1 },
      params: { id: 999 },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await staffController.deleteSalonStaffHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Staff not found" });
  });
});
