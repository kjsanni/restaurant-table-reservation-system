const whatsappOtpService = require("../services/whatsapp-otp.service");

jest.mock("../utils/cache", () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
}));

const { cache } = require("../utils/cache");
const crypto = require("crypto");

describe("whatsapp-otp.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generateOTP", () => {
    it("returns a 6-digit code and stores hashed value in cache", async () => {
      cache.set.mockResolvedValue();
      const code = await whatsappOtpService.generateOTP(1, "+233241234567", 10);
      expect(code).toMatch(/^\d{6}$/);
      expect(cache.set).toHaveBeenCalledTimes(1);
      expect(cache.del).toHaveBeenCalledTimes(1);
      const setCall = cache.set.mock.calls[0];
      expect(setCall[0]).toBe("wa_otp:1");
      expect(setCall[2]).toBe(300);
    });
  });

  describe("verifyOTP", () => {
    it("returns valid when code matches stored hash", async () => {
      const code = "123456";
      const hash = crypto.createHash("sha256").update(code).digest("hex");
      cache.get
        .mockResolvedValueOnce({ hash, phone: "+233241234567", tenantId: 10, createdAt: Date.now() })
        .mockResolvedValueOnce(null);
      cache.del.mockResolvedValue(1);

      const result = await whatsappOtpService.verifyOTP(1, code);
      expect(result.valid).toBe(true);
      expect(cache.del).toHaveBeenCalledTimes(2);
    });

    it("returns invalid when code does not match", async () => {
      const hash = crypto.createHash("sha256").update("999999").digest("hex");
      cache.get
        .mockResolvedValueOnce({ hash, phone: "+233241234567", tenantId: 10, createdAt: Date.now() })
        .mockResolvedValueOnce(null);

      const result = await whatsappOtpService.verifyOTP(1, "123456");
      expect(result.valid).toBe(false);
      expect(result.reason).toBe("invalid_code");
    });

    it("returns expired_or_missing when no entry exists", async () => {
      cache.get.mockResolvedValue(null);

      const result = await whatsappOtpService.verifyOTP(1, "123456");
      expect(result.valid).toBe(false);
      expect(result.reason).toBe("expired_or_missing");
    });

    it("returns too_many_attempts after exceeding limit", async () => {
      const hash = crypto.createHash("sha256").update("999999").digest("hex");
      cache.get
        .mockResolvedValueOnce({ hash, phone: "+233241234567", tenantId: 10, createdAt: Date.now() })
        .mockResolvedValueOnce({ count: 5 });

      const result = await whatsappOtpService.verifyOTP(1, "123456");
      expect(result.valid).toBe(false);
      expect(result.reason).toBe("too_many_attempts");
    });
  });

  describe("clearOTP", () => {
    it("deletes both OTP and attempts keys", async () => {
      cache.del.mockResolvedValue(1);
      await whatsappOtpService.clearOTP(1);
      expect(cache.del).toHaveBeenCalledTimes(2);
      expect(cache.del).toHaveBeenCalledWith("wa_otp:1");
      expect(cache.del).toHaveBeenCalledWith("wa_otp:attempts:1");
    });
  });
});
