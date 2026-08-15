"use strict";

jest.mock("../verticals/event/services/walletPass.service", () => ({
  signAllPlatforms: jest.fn(),
}));

jest.mock("../tenant-platform/DAOs/passSigningRequest.dao", () => ({
  setSigning: jest.fn(),
  findById: jest.fn(),
  updatePlatformStatus: jest.fn(),
  markCompletedIfAllDone: jest.fn(),
}));

jest.mock("../tenant-platform/DAOs/signedPassArtifact.dao", () => ({
  create: jest.fn(),
}));

jest.mock("../tenant-platform/DAOs/platformAudit.dao", () => ({
  log: jest.fn().mockResolvedValue(),
}));

describe("Wallet Pass Signing Queue Worker", () => {
  let mockQueue;
  let mockWorker;
  let queueModule;
  let Worker;
  let walletPassService;
  let passSigningRequestDAO;
  let signedPassArtifactDAO;

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

    queueModule = require("../queues/walletPass.queue");
    walletPassService = require("../verticals/event/services/walletPass.service");
    passSigningRequestDAO = require("../tenant-platform/DAOs/passSigningRequest.dao");
    signedPassArtifactDAO = require("../tenant-platform/DAOs/signedPassArtifact.dao");
  };

  beforeEach(() => {
    loadQueueModule();
  });

  afterEach(async () => {
    if (queueModule) {
      await queueModule.closeWalletPassSigningWorker();
    }
  });

  describe("startWalletPassSigningWorker", () => {
    it("creates a BullMQ worker for wallet-pass-signing queue", () => {
      const worker = queueModule.startWalletPassSigningWorker();
      expect(Worker).toHaveBeenCalledWith(
        "wallet-pass-signing",
        expect.any(Function),
        expect.objectContaining({
          connection: expect.any(Object),
          concurrency: 2,
        })
      );
      expect(worker).toBe(mockWorker);
    });
  });

  describe("enqueueWalletPassSigning", () => {
    it("adds a wallet-sign job to the queue", async () => {
      const result = await queueModule.enqueueWalletPassSigning(1, 10);
      expect(mockQueue.add).toHaveBeenCalledWith(
        "wallet-sign",
        { requestId: 1, tenantId: 10 },
        expect.any(Object)
      );
      expect(result).toEqual({ enqueued: true, jobId: "job-1" });
    });
  });

  describe("worker job processing", () => {
    it("processes signing job successfully for all platforms", async () => {
      walletPassService.signAllPlatforms.mockResolvedValue({
        results: {
          apple: { artifactType: "file", artifactPath: "/tmp/ticket.pkpass", accessToken: null, signingResult: {} },
          google: { artifactType: "url", artifactPath: "https://pay.google.com/...", accessToken: "jwt-token", signingResult: {} },
          samsung: { artifactType: "url", artifactPath: "https://samsung.com/...", accessToken: "access-token", signingResult: {} },
        },
        errors: {},
        platforms: ["apple", "google", "samsung"],
      });

      passSigningRequestDAO.findById.mockResolvedValue({
        id: 1,
        tenantId: 10,
        designSnapshot: { design: {}, ticketData: {} },
        status: "approved",
      });
      signedPassArtifactDAO.create.mockResolvedValue({});
      passSigningRequestDAO.updatePlatformStatus.mockResolvedValue({});
      passSigningRequestDAO.markCompletedIfAllDone.mockResolvedValue({});

      queueModule.startWalletPassSigningWorker();
      const jobProcessor = Worker.mock.calls[0][1];
      const result = await jobProcessor({ data: { requestId: 1, tenantId: 10 } });

      expect(passSigningRequestDAO.setSigning).toHaveBeenCalledWith(1);
      expect(walletPassService.signAllPlatforms).toHaveBeenCalledWith(
        { design: {}, ticketData: {} },
        10
      );
      expect(signedPassArtifactDAO.create).toHaveBeenCalledTimes(3);
      expect(passSigningRequestDAO.updatePlatformStatus).toHaveBeenCalledWith(1, "apple", "signed");
      expect(passSigningRequestDAO.updatePlatformStatus).toHaveBeenCalledWith(1, "google", "signed");
      expect(passSigningRequestDAO.updatePlatformStatus).toHaveBeenCalledWith(1, "samsung", "signed");
      expect(passSigningRequestDAO.markCompletedIfAllDone).toHaveBeenCalledWith(1);
    });

    it("handles partial failures (one platform fails)", async () => {
      walletPassService.signAllPlatforms.mockResolvedValue({
        results: {
          apple: null,
          google: { artifactType: "url", artifactPath: "https://pay.google.com/...", accessToken: "jwt", signingResult: {} },
          samsung: { artifactType: "url", artifactPath: "https://samsung.com/...", accessToken: "tok", signingResult: {} },
        },
        errors: { apple: "Certificate not configured" },
        platforms: ["apple", "google", "samsung"],
      });

      passSigningRequestDAO.findById.mockResolvedValue({
        id: 1,
        tenantId: 10,
        designSnapshot: { design: {}, ticketData: {} },
        status: "approved",
      });
      signedPassArtifactDAO.create.mockResolvedValue({});
      passSigningRequestDAO.updatePlatformStatus.mockResolvedValue({});
      passSigningRequestDAO.markCompletedIfAllDone.mockResolvedValue({});

      queueModule.startWalletPassSigningWorker();
      const jobProcessor = Worker.mock.calls[0][1];
      await jobProcessor({ data: { requestId: 1, tenantId: 10 } });

      expect(passSigningRequestDAO.updatePlatformStatus).toHaveBeenCalledWith(1, "apple", "failed");
      expect(passSigningRequestDAO.updatePlatformStatus).toHaveBeenCalledWith(1, "google", "signed");
      expect(passSigningRequestDAO.updatePlatformStatus).toHaveBeenCalledWith(1, "samsung", "signed");
    });

    it("throws error when requestId is missing", async () => {
      queueModule.startWalletPassSigningWorker();
      const jobProcessor = Worker.mock.calls[0][1];
      await expect(jobProcessor({ data: { tenantId: 10 } })).rejects.toThrow(
        "requestId and tenantId are required for wallet pass signing"
      );
    });

    it("throws error when tenantId is missing", async () => {
      queueModule.startWalletPassSigningWorker();
      const jobProcessor = Worker.mock.calls[0][1];
      await expect(jobProcessor({ data: { requestId: 1 } })).rejects.toThrow(
        "requestId and tenantId are required for wallet pass signing"
      );
    });
  });

  describe("closeWalletPassSigningWorker", () => {
    it("closes the worker when running", async () => {
      queueModule.startWalletPassSigningWorker();
      await queueModule.closeWalletPassSigningWorker();
      expect(mockWorker.close).toHaveBeenCalled();
    });

    it("handles close when worker is not running", async () => {
      await queueModule.closeWalletPassSigningWorker();
      expect(mockWorker.close).not.toHaveBeenCalled();
    });
  });
});
