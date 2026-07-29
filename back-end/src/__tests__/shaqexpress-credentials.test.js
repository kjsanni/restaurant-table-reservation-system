const { getCredentials, verifyWebhookSignature } = require("../services/shaqexpress.service");

jest.mock("axios");
jest.mock("../db/models");

describe("shaqexpress.service per-tenant credentials", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe("getCredentials", () => {
    it("returns identifier and secret for a given tenantId", async () => {
      const db = require("../db/models");
      db.setting = {
        findOne: jest.fn().mockResolvedValue({
          value: { identifier: "tenant-api-id", secret: "tenant-api-secret" },
        }),
      };

      const { getCredentials } = require("../services/shaqexpress.service");
      const creds = await getCredentials(10);

      expect(creds).toEqual({
        identifier: "tenant-api-id",
        secret: "tenant-api-secret",
        enabled: true,
      });
      expect(db.setting.findOne).toHaveBeenCalledWith({
        where: { key: "shaqexpress_config", tenantId: 10 },
      });
    });

    it("returns enabled=false when identifier is missing", async () => {
      const db = require("../db/models");
      db.setting = {
        findOne: jest.fn().mockResolvedValue({
          value: { identifier: "", secret: "secret" },
        }),
      };

      const { getCredentials } = require("../services/shaqexpress.service");
      const creds = await getCredentials(10);

      expect(creds.enabled).toBe(false);
    });

    it("throws when settings are missing", async () => {
      const db = require("../db/models");
      db.setting = { findOne: jest.fn().mockResolvedValue(null) };

      const { getCredentials } = require("../services/shaqexpress.service");
      expect(getCredentials(10)).rejects.toThrow("Shaq Express is not configured.");
    });

    it("queries globally when tenantId is null", async () => {
      const db = require("../db/models");
      db.setting = {
        findOne: jest.fn().mockResolvedValue({
          value: { identifier: "global-id", secret: "global-secret" },
        }),
      };

      const { getCredentials } = require("../services/shaqexpress.service");
      const creds = await getCredentials(null);

      expect(db.setting.findOne).toHaveBeenCalledWith({
        where: { key: "shaqexpress_config" },
      });
      expect(creds.identifier).toBe("global-id");
    });
  });

  describe("verifyWebhookSignature", () => {
    it("returns true when signature matches HMAC-SHA256", () => {
      const crypto = require("crypto");
      const payload = { event: "test", data: {} };
      const secret = "webhook-secret";
      const signature = crypto.createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex");

      const result = verifyWebhookSignature(payload, signature, secret);
      expect(result).toBe(true);
    });

    it("returns false when signature mismatches", () => {
      const payload = { event: "test" };
      const result = verifyWebhookSignature(payload, "wrong-sig", "secret");
      expect(result).toBe(false);
    });

    it("returns false when secret is missing", () => {
      const payload = { event: "test" };
      const result = verifyWebhookSignature(payload, "sig", null);
      expect(result).toBe(false);
    });
  });
});
