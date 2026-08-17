"use strict";

jest.mock("../verticals/event/adapters", () => ({
  signAllPlatforms: jest.fn(),
  getAdapter: jest.fn(),
  SUPPORTED_PLATFORMS: ["apple", "google", "samsung"],
}));

jest.mock("../db/models", () => ({
  setting: {
    findAll: jest.fn(),
  },
  Sequelize: {
    Op: { in: 5 },
    literal: jest.fn((str) => str),
  },
}));

const walletPassService = require("../verticals/event/services/walletPass.service");
const { signAllPlatforms, getAdapter } = require("../verticals/event/adapters");
const db = require("../db/models");

describe("walletPass.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("signAllPlatforms", () => {
    it("delegates to the adapter registry", async () => {
      const mockResult = {
        results: { apple: { artifactType: "file", artifactPath: "/tmp/t.pkpass" } },
        errors: {},
        platforms: ["apple", "google", "samsung"],
      };
      signAllPlatforms.mockResolvedValue(mockResult);

      const snapshot = { design: { backgroundColor: "#007AFF" }, ticketData: { id: 1 } };
      const result = await walletPassService.signAllPlatforms(snapshot, 1);

      expect(signAllPlatforms).toHaveBeenCalledWith(snapshot, 1);
      expect(result).toEqual(mockResult);
    });
  });

  describe("signForPlatform", () => {
    it("uses the platform-specific adapter", async () => {
      const mockAdapter = { sign: jest.fn().mockResolvedValue({ artifactType: "file" }) };
      getAdapter.mockReturnValue(mockAdapter);

      const result = await walletPassService.signForPlatform("apple", { design: {} }, 1);
      expect(getAdapter).toHaveBeenCalledWith("apple");
      expect(mockAdapter.sign).toHaveBeenCalledWith({ design: {} }, 1);
      expect(result).toEqual({ platform: "apple", artifactType: "file" });
    });
  });

  describe("getSupportedPlatforms", () => {
    it("returns the known platform list", () => {
      expect(walletPassService.getSupportedPlatforms()).toEqual(["apple", "google", "samsung"]);
    });
  });

  describe("loadTenantDesign", () => {
    it("loads design from tenant settings with fallback defaults", async () => {
      db.setting.findAll.mockResolvedValue([
        { key: "wallet_pass_design", value: { backgroundColor: "#ff0000" } },
        { key: "event_qr_secret", value: "test-secret" },
      ]);

      const result = await walletPassService.loadTenantDesign(1);

      expect(db.setting.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 1,
          }),
        })
      );
      expect(result.design).toEqual({ backgroundColor: "#ff0000" });
      expect(result.config.qrSecret).toBe("test-secret");
    });

    it("returns empty design when no settings found", async () => {
      db.setting.findAll.mockResolvedValue([]);
      const result = await walletPassService.loadTenantDesign(1);
      expect(result.design).toEqual({});
    });
  });

  describe("generateArtifact", () => {
    it("loads design, builds snapshot, and signs", async () => {
      db.setting.findAll.mockResolvedValue([
        { key: "wallet_pass_design", value: { backgroundColor: "#007AFF" } },
        { key: "event_qr_secret", value: "secret123" },
      ]);

      signAllPlatforms.mockResolvedValue({
        results: { apple: { artifactType: "file" } },
        errors: {},
        platforms: ["apple", "google", "samsung"],
      });

      const ticketData = { id: 1, attendeeName: "John" };
      const result = await walletPassService.generateArtifact(ticketData, 1);

      expect(result.results.apple).toEqual({ artifactType: "file" });
      expect(signAllPlatforms).toHaveBeenCalledWith(
        expect.objectContaining({
          design: { backgroundColor: "#007AFF" },
          ticketData: { id: 1, attendeeName: "John" },
        }),
        1
      );
    });
  });
});
