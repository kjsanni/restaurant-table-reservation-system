"use strict";

jest.mock("../tenant-platform/services/provisioning.service", () => ({
  startProvisioning: jest.fn().mockResolvedValue({ status: "completed" }),
}));

describe("Provisioning Queue Worker", () => {
  let mockQueue;
  let mockWorker;
  let queueModule;
  let Worker;
  let provisioningService;

  const loadQueueModule = () => {
    jest.resetModules();
    const Queue = require("bullmq").Queue;
    Worker = require("bullmq").Worker;

    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: "job-1" }),
      close: jest.fn().mockResolvedValue(undefined),
    };
    mockWorker = {
      close: jest.fn().mockResolvedValue(undefined),
      pause: jest.fn(),
      resume: jest.fn(),
      on: jest.fn(),
    };

    Queue.mockImplementation(() => mockQueue);
    Worker.mockImplementation(() => mockWorker);

    queueModule = require("../queues/provisioning.queue");
    provisioningService = require("../tenant-platform/services/provisioning.service");
  };

  beforeEach(() => {
    loadQueueModule();
  });

  afterEach(async () => {
    if (queueModule) {
      await queueModule.closeProvisioningWorker();
    }
  });

  describe("startProvisioningWorker", () => {
    it("creates a BullMQ worker for provisioning queue", () => {
      const worker = queueModule.startProvisioningWorker();
      expect(Worker).toHaveBeenCalledWith(
        "provisioning",
        expect.any(Function),
        expect.objectContaining({
          connection: expect.any(Object),
          concurrency: 2,
        })
      );
      expect(worker).toBe(mockWorker);
    });
  });

  describe("enqueueProvisioning", () => {
    it("adds a provisioning job to the queue", async () => {
      const result = await queueModule.enqueueProvisioning(10, 1);
      expect(mockQueue.add).toHaveBeenCalledWith(
        "provision-tenant",
        { tenantId: 10, initiatedBy: 1 },
        expect.any(Object)
      );
      expect(result).toEqual({ enqueued: true, jobId: "job-1" });
    });
  });

  describe("worker job processing", () => {
    it("processes provisioning job successfully", async () => {
      provisioningService.startProvisioning.mockResolvedValue({ status: "completed" });
      queueModule.startProvisioningWorker();

      const jobProcessor = Worker.mock.calls[0][1];
      const result = await jobProcessor({ data: { tenantId: 10, initiatedBy: 1 } });

      expect(provisioningService.startProvisioning).toHaveBeenCalledWith(10, 1);
      expect(result).toEqual({ status: "completed" });
    });

    it("throws error when tenantId is missing", async () => {
      queueModule.startProvisioningWorker();
      const jobProcessor = Worker.mock.calls[0][1];

      await expect(jobProcessor({ data: { initiatedBy: 1 } })).rejects.toThrow(
        "tenantId is required for provisioning"
      );
    });
  });

  describe("closeProvisioningWorker", () => {
    it("closes the worker when running", async () => {
      queueModule.startProvisioningWorker();
      await queueModule.closeProvisioningWorker();
      expect(mockWorker.close).toHaveBeenCalled();
    });

    it("handles close when worker is not running", async () => {
      await queueModule.closeProvisioningWorker();
      expect(mockWorker.close).not.toHaveBeenCalled();
    });
  });
});
