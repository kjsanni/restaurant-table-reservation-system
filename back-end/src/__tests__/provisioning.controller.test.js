"use strict";

const provisioningService = require("../tenant-platform/services/provisioning.service");

jest.mock("../tenant-platform/services/provisioning.service", () => ({
  STEPS: [{ key: "step1", label: "Step 1" }],
  startProvisioning: jest.fn(),
  pauseProvisioning: jest.fn(),
  resumeProvisioning: jest.fn(),
  rollbackProvisioning: jest.fn(),
  getProvisioningStatus: jest.fn(),
}));

jest.mock("../queues/provisioning.queue", () => ({
  enqueueProvisioning: jest.fn().mockResolvedValue({ enqueued: true, jobId: "job-1" }),
}));

const provisioningController = require("../tenant-platform/controllers/provisioning.controller");
const { enqueueProvisioning } = require("../queues/provisioning.queue");

const { createRes } = require("./utils/test-response");

describe("provisioning.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function createReq(params = {}) {
    return {
      params,
      user: { id: 1 },
      ip: "127.0.0.1",
    };
  }

  describe("startProvisioningHandler", () => {
    it("queues provisioning and returns 202", async () => {
      const req = createReq({ tenantId: "10" });
      const res = createRes();

      await provisioningController.startProvisioningHandler(req, res);

      expect(enqueueProvisioning).toHaveBeenCalledWith("10", 1);
      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.json).toHaveBeenCalledWith({ success: true, jobId: "job-1", message: "Provisioning queued" });
    });

    it("returns 503 when queue is unavailable", async () => {
      enqueueProvisioning.mockResolvedValueOnce({ enqueued: false });

      const req = createReq({ tenantId: "10" });
      const res = createRes();

      await provisioningController.startProvisioningHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "Queue unavailable; provisioning could not be started" });
    });
  });

  describe("pauseProvisioningHandler", () => {
    it("pauses provisioning and returns pipeline", async () => {
      const pipeline = { status: "paused", steps: [] };
      provisioningService.pauseProvisioning.mockResolvedValue(pipeline);

      const req = createReq({ tenantId: "10" });
      const res = createRes();

      await provisioningController.pauseProvisioningHandler(req, res);

      expect(provisioningService.pauseProvisioning).toHaveBeenCalledWith("10", 1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, item: pipeline });
    });
  });

  describe("resumeProvisioningHandler", () => {
    it("resumes provisioning and returns pipeline", async () => {
      const pipeline = { status: "running", steps: [] };
      provisioningService.resumeProvisioning.mockResolvedValue(pipeline);

      const req = createReq({ tenantId: "10" });
      const res = createRes();

      await provisioningController.resumeProvisioningHandler(req, res);

      expect(provisioningService.resumeProvisioning).toHaveBeenCalledWith("10", 1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, item: pipeline });
    });
  });

  describe("rollbackProvisioningHandler", () => {
    it("rolls back provisioning and returns pipeline", async () => {
      const pipeline = { status: "rolled_back", steps: [] };
      provisioningService.rollbackProvisioning.mockResolvedValue(pipeline);

      const req = createReq({ tenantId: "10" });
      const res = createRes();

      await provisioningController.rollbackProvisioningHandler(req, res);

      expect(provisioningService.rollbackProvisioning).toHaveBeenCalledWith("10", 1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, item: pipeline });
    });
  });

  describe("getProvisioningStatusHandler", () => {
    it("returns provisioning status when found", async () => {
      const status = { status: "completed", steps: [] };
      provisioningService.getProvisioningStatus.mockReturnValue(status);

      const req = createReq({ tenantId: "10" });
      const res = createRes();

      await provisioningController.getProvisioningStatusHandler(req, res);

      expect(provisioningService.getProvisioningStatus).toHaveBeenCalledWith("10");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, item: status });
    });

    it("returns 404 when provisioning not found", async () => {
      provisioningService.getProvisioningStatus.mockReturnValue(null);

      const req = createReq({ tenantId: "10" });
      const res = createRes();

      await provisioningController.getProvisioningStatusHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "Provisioning not found for this tenant" });
    });
  });

  describe("listProvisioningStepsHandler", () => {
    it("returns provisioning steps", async () => {
      const steps = [{ key: "step1", label: "Step 1" }];
      provisioningService.STEPS = steps;

      const req = createReq();
      const res = createRes();

      await provisioningController.listProvisioningStepsHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, items: steps });
    });
  });
});
