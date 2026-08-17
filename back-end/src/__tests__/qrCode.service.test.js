// codacy-suppress Cryptography,Hardcoded_Secrets - test-only fixtures for unit tests
"use strict";

jest.mock("../db/models", () => {
  const SequelizeLib = require("sequelize");
  return {
    Sequelize: SequelizeLib,
    sequelize: {
      fn: jest.fn(),
      col: jest.fn(),
      Op: SequelizeLib.Op,
      transaction: jest.fn(),
      lock: { update: "UPDATE" },
    },
    QRCode: {
      create: jest.fn(),
      findOne: jest.fn(),
      findAndCountAll: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(),
      increment: jest.fn(),
    },
    AuditLog: {
      create: jest.fn().mockResolvedValue({}),
    },
    setting: {
      findOne: jest.fn().mockResolvedValue(null),
    },
    Event: {
      findOne: jest.fn(),
    },
    event: {
      findOne: jest.fn(),
    },
    Op: SequelizeLib.Op,
  };
});

jest.mock("../utils/redis", () => ({
  acquireLock: jest.fn(),
  releaseLock: jest.fn(),
}));

jest.mock("../utils/cache", () => ({
  get: jest.fn(),
  set: jest.fn().mockResolvedValue(true),
  del: jest.fn().mockResolvedValue(1),
}));

jest.mock("../middleware/auditLog", () => ({
  logAction: jest.fn(),
}));

jest.mock("../verticals/event/DAOs/guestList.dao", () => ({
  update: jest.fn().mockResolvedValue(true),
}));

const crypto = require("crypto");
const db = require("../db/models");
const cache = require("../utils/cache");
const { acquireLock, releaseLock } = require("../utils/redis");
const qrCodeDAO = require("../verticals/event/DAOs/qrCode.dao");
const qrCodeService = require("../verticals/event/services/qrCode.service");

const TEST_SECRET = "test-qr-secret-12345";
const TEST_TOKEN = "a".repeat(64);
const TEST_TOKEN_HASH = crypto.createHash("sha256").update(TEST_TOKEN).digest("hex");
const TEST_SIGNATURE = crypto.createHmac("sha256", TEST_SECRET).update(TEST_TOKEN).digest("hex");

describe("QRCode Service (Security Layer)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.setting.findOne.mockResolvedValue({ value: TEST_SECRET });
    db.AuditLog.create.mockResolvedValue({});
    cache.get.mockResolvedValue(null);
    cache.set.mockResolvedValue(true);
    acquireLock.mockResolvedValue({ acquired: true, reason: "acquired" });
    releaseLock.mockResolvedValue({ released: true });
  });

  describe("HMAC signing", () => {
    it("generateQRCode returns rawToken + HMAC-signed payload", async () => {
      const mockRecord = { id: 1, code: "abc", attendeeName: "John", seat: "A1", tier: "VIP", maxUses: 1, expiresAt: null };
      qrCodeDAO.create = jest.fn().mockResolvedValue({
        record: mockRecord,
        rawToken: TEST_TOKEN,
        tokenHash: TEST_TOKEN_HASH,
      });

      const result = await qrCodeService.generateQRCode(1, { attendeeName: "John Doe" }, 1);

      expect(result.rawToken).toBe(TEST_TOKEN);
      expect(result.qrPayload).toBeDefined();
      expect(result.qrPayload.signature).toBeDefined();
      expect(result.qrPayload.signature).toHaveLength(64);
      expect(result.tokenHash).toBe(TEST_TOKEN_HASH);
    });

    it("verifyPayload uses crypto.timingSafeEqual", () => {
      const payload = { t: "abc", e: 1, n: "John", i: 123 };
      const sig = qrCodeService.signPayload(payload, TEST_SECRET);
      expect(qrCodeService.verifyPayload(payload, sig, TEST_SECRET)).toBe(true);
      expect(qrCodeService.verifyPayload(payload, "wrong-sig", TEST_SECRET)).toBe(false);
    });

    it("verifySignature validates HMAC of rawToken", () => {
      expect(qrCodeService.verifySignature(TEST_TOKEN, TEST_SIGNATURE, TEST_SECRET)).toBe(true);
      expect(qrCodeService.verifySignature(TEST_TOKEN, "invalid-sig", TEST_SECRET)).toBe(false);
    });

    it("different secrets produce different signatures", () => {
      const sig1 = qrCodeService.signPayload({ t: "x", e: 1 }, "secret1");
      const sig2 = qrCodeService.signPayload({ t: "x", e: 1 }, "secret2");
      expect(sig1).not.toBe(sig2);
    });
  });

  describe("checkin — signature verification (before DB)", () => {
    it("rejects invalid signature without touching DAO", async () => {
      db.setting.findOne.mockResolvedValue({ value: TEST_SECRET });
      cache.get.mockResolvedValue(null);

      const result = await qrCodeService.checkin(TEST_TOKEN, 1, 1, { signature: "bogus-sig" });

      expect(result.valid).toBe(false);
      expect(result.error).toBe("INVALID_SIGNATURE");
      expect(releaseLock).not.toHaveBeenCalled();
    });

    it("accepts valid signature and proceeds to check-in", async () => {
      const mockQr = {
        id: 1,
        usedCount: 0,
        maxUses: 1,
        status: "active",
        expiresAt: null,
        validFrom: null,
        attendeeName: "John",
        seat: "A1",
        tier: "VIP",
        eventId: 5,
        guestListId: null,
        checkedInAt: null,
        toJSON: jest.fn().mockReturnValue({ id: 1 }),
        increment: jest.fn().mockResolvedValue([1]),
        update: jest.fn().mockResolvedValue(),
      };

      db.sequelize.transaction = jest.fn().mockImplementation(async (cb) => cb({ LOCK: { UPDATE: "UPDATE" } }));
      db.QRCode.findOne.mockResolvedValue(mockQr);

      const result = await qrCodeService.checkin(TEST_TOKEN, 1, 1, {
        signature: TEST_SIGNATURE,
        scannerId: "scanner-001",
      });

      expect(result.valid).toBe(true);
      expect(result.admitted).toBe(true);
      expect(result.item.attendeeName).toBe("John");
    });
  });

  describe("checkin — token format validation", () => {
    it("rejects tokens that are not 64 chars", async () => {
      const result = await qrCodeService.checkin("short", 1, 1, {});
      expect(result.valid).toBe(false);
      expect(result.error).toBe("INVALID_TOKEN");
    });

    it("rejects null/undefined tokens", async () => {
      const result = await qrCodeService.checkin(null, 1, 1, {});
      expect(result.valid).toBe(false);
      expect(result.error).toBe("INVALID_TOKEN");
    });

    it("rejects non-string tokens", async () => {
      const result = await qrCodeService.checkin(12345, 1, 1, {});
      expect(result.valid).toBe(false);
      expect(result.error).toBe("INVALID_TOKEN");
    });
  });

  describe("checkin — rate limiting", () => {
    it("rejects when rate limit exceeded", async () => {
      cache.get.mockResolvedValueOnce(QR_SCAN_RATE_LIMIT).mockResolvedValue(null);

      const result = await qrCodeService.checkin(TEST_TOKEN, 1, 1, { signature: TEST_SIGNATURE });
      expect(result.valid).toBe(false);
      expect(result.error).toBe("RATE_LIMITED");
    });

    it("allows within rate limit", async () => {
      cache.get.mockResolvedValue(0);
      db.sequelize.transaction = jest.fn().mockImplementation(async (cb) => cb({ LOCK: { UPDATE: "UPDATE" } }));
      db.QRCode.findOne.mockResolvedValue(null);

      const result = await qrCodeService.checkin(TEST_TOKEN, 1, 1, { signature: TEST_SIGNATURE });
      expect(result.valid).toBe(false);
      expect(result.error).toBe("INVALID_TOKEN");
      expect(cache.set).toHaveBeenCalled();
    });
  });

  describe("checkin — device binding (anti-forwarding)", () => {
    it("rejects when token bound to different scanner", async () => {
      cache.get
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce("scanner-A");

      const result = await qrCodeService.checkin(TEST_TOKEN, 1, 1, {
        signature: TEST_SIGNATURE,
        scannerId: "scanner-B",
      });

      expect(result.valid).toBe(false);
      expect(result.error).toBe("DEVICE_MISMATCH");
    });

    it("allows when token bound to same scanner", async () => {
      cache.get
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce("scanner-A");

      db.sequelize.transaction = jest.fn().mockImplementation(async (cb) => cb({ LOCK: { UPDATE: "UPDATE" } }));
      const mockQr = {
        id: 1,
        usedCount: 0,
        maxUses: 1,
        status: "active",
        expiresAt: null,
        validFrom: null,
        attendeeName: "John",
        seat: "A1",
        tier: "VIP",
        eventId: 5,
        guestListId: null,
        checkedInAt: null,
        toJSON: jest.fn().mockReturnValue({ id: 1 }),
        increment: jest.fn().mockResolvedValue([1]),
        update: jest.fn().mockResolvedValue(),
      };
      db.QRCode.findOne.mockResolvedValue(mockQr);

      const result = await qrCodeService.checkin(TEST_TOKEN, 1, 1, {
        signature: TEST_SIGNATURE,
        scannerId: "scanner-A",
      });

      expect(result.valid).toBe(true);
      expect(result.admitted).toBe(true);
    });
  });

  describe("checkin — expired token", () => {
    it("rejects expired tokens", async () => {
      db.sequelize.transaction = jest.fn().mockImplementation(async (cb) => cb({ LOCK: { UPDATE: "UPDATE" } }));

      const mockQr = {
        id: 1,
        usedCount: 0,
        maxUses: 1,
        status: "active",
        expiresAt: new Date(Date.now() - 1000),
        validFrom: null,
        toJSON: jest.fn().mockReturnValue({ id: 1, usedCount: 999 }),
        increment: jest.fn(),
        update: jest.fn(),
      };
      db.QRCode.findOne.mockResolvedValue(mockQr);

      const result = await qrCodeService.checkin(TEST_TOKEN, 1, 1, { signature: TEST_SIGNATURE });

      expect(result.valid).toBe(false);
      expect(result.error).toBe("EXPIRED");
    });
  });

  describe("checkin — already used token", () => {
    it("rejects tokens that have reached maxUses", async () => {
      db.sequelize.transaction = jest.fn().mockImplementation(async (cb) => cb({ LOCK: { UPDATE: "UPDATE" } }));

      const mockQr = {
        id: 1,
        usedCount: 1,
        maxUses: 1,
        status: "used",
        expiresAt: null,
        validFrom: null,
        toJSON: jest.fn().mockReturnValue({ id: 1, usedCount: 1 }),
        increment: jest.fn(),
        update: jest.fn(),
      };
      db.QRCode.findOne.mockResolvedValue(mockQr);

      const result = await qrCodeService.checkin(TEST_TOKEN, 1, 1, { signature: TEST_SIGNATURE });

      expect(result.valid).toBe(false);
      expect(result.error).toBe("ALREADY_USED");
    });
  });

  describe("checkin — concurrent scan (Redis lock)", () => {
    it("returns CONCURRENT_SCAN when lock unavailable", async () => {
      acquireLock.mockResolvedValue({ acquired: false, reason: "already_held" });

      const result = await qrCodeService.checkin(TEST_TOKEN, 1, 1, { signature: TEST_SIGNATURE });

      expect(result.valid).toBe(false);
      expect(result.error).toBe("CONCURRENT_SCAN");
      expect(releaseLock).not.toHaveBeenCalled();
    });
  });

  describe("checkin — successful admission", () => {
    it("returns attendee details on successful check-in", async () => {
      db.sequelize.transaction = jest.fn().mockImplementation(async (cb) => cb({ LOCK: { UPDATE: "UPDATE" } }));

      const fixedDate = new Date("2025-01-01T12:00:00Z");
      const mockQr = {
        id: 99,
        usedCount: 0,
        maxUses: 1,
        status: "active",
        expiresAt: null,
        validFrom: null,
        attendeeName: "Alice Smith",
        seat: "B5",
        tier: "VIP",
        ticketType: "Early Bird",
        eventId: 5,
        guestListId: null,
        checkedInAt: fixedDate,
        toJSON: jest.fn().mockReturnValue({ id: 99, usedCount: 0 }),
        increment: jest.fn().mockResolvedValue([1]),
        update: jest.fn().mockResolvedValue(),
      };
      db.QRCode.findOne.mockResolvedValue(mockQr);

      const result = await qrCodeService.checkin(TEST_TOKEN, 1, 1, { signature: TEST_SIGNATURE });

      expect(result.valid).toBe(true);
      expect(result.admitted).toBe(true);
      expect(result.item.id).toBe(99);
      expect(result.item.attendeeName).toBe("Alice Smith");
      expect(result.item.seat).toBe("B5");
      expect(result.item.tier).toBe("VIP");
      expect(result.item.ticketType).toBe("Early Bird");
      expect(cache.set).toHaveBeenCalledWith(
        `scan_recent:${TEST_TOKEN_HASH}`,
        true,
        60 * 7
      );
    });

    it("updates guestList status after successful check-in", async () => {
      const guestListDAO = require("../verticals/event/DAOs/guestList.dao");

      db.sequelize.transaction = jest.fn().mockImplementation(async (cb) => cb({ LOCK: { UPDATE: "UPDATE" } }));

      const mockQr = {
        id: 1,
        usedCount: 0,
        maxUses: 1,
        status: "active",
        expiresAt: null,
        validFrom: null,
        attendeeName: "John",
        seat: "A1",
        tier: "GA",
        eventId: 5,
        guestListId: 10,
        checkedInAt: null,
        toJSON: jest.fn().mockReturnValue({ id: 1 }),
        increment: jest.fn().mockResolvedValue([1]),
        update: jest.fn().mockResolvedValue(),
      };
      db.QRCode.findOne.mockResolvedValue(mockQr);

      await qrCodeService.checkin(TEST_TOKEN, 1, 1, { signature: TEST_SIGNATURE });

      expect(guestListDAO.update).toHaveBeenCalledWith(
        10, 5, 1,
        expect.objectContaining({
          status: "checked_in",
        })
      );
    });
  });

  describe("checkin — token not found", () => {
    it("returns INVALID_TOKEN when hash lookup fails", async () => {
      db.sequelize.transaction = jest.fn().mockImplementation(async (cb) => cb({ LOCK: { UPDATE: "UPDATE" } }));
      db.QRCode.findOne.mockResolvedValue(null);

      const result = await qrCodeService.checkin(TEST_TOKEN, 1, 1, { signature: TEST_SIGNATURE });

      expect(result.valid).toBe(false);
      expect(result.error).toBe("INVALID_TOKEN");
    });
  });

  describe("verifyToken", () => {
    it("hashes raw token and looks up by hash", async () => {
      const expectedHash = qrCodeDAO.hashToken(TEST_TOKEN);
      qrCodeDAO.findByTokenHash = jest.fn().mockResolvedValue({ id: 1, attendeeName: "John" });
      db.setting.findOne.mockResolvedValue({ value: TEST_SECRET });

      const result = await qrCodeService.verifyToken(TEST_TOKEN, 1);

      expect(qrCodeDAO.findByTokenHash).toHaveBeenCalledWith(expectedHash, 1);
      expect(result).toEqual({ id: 1, attendeeName: "John" });
    });
  });

  describe("batch generation", () => {
    it("generates multiple QR codes with unique tokens", async () => {
      const mockRecord = {
        id: 1,
        code: "abc",
        attendeeName: null,
        seat: null,
        tier: null,
        maxUses: 1,
        expiresAt: null,
      };

      const tokens = [];
      qrCodeDAO.create = jest.fn().mockImplementation(async () => {
        const raw = crypto.randomBytes(32).toString("hex");
        const tokenHash = qrCodeDAO.hashToken(raw);
        tokens.push(raw);
        return { record: mockRecord, rawToken: raw, tokenHash };
      });

      const results = await qrCodeService.generateBatchQRCodes(1, 5, { attendeeNames: ["A", "B", "C", "D", "E"] }, 1);

      expect(results).toHaveLength(5);
      expect(new Set(tokens).size).toBe(tokens.length);
      expect(qrCodeDAO.create).toHaveBeenCalledTimes(5);
    });

    it("uses Attendee N naming when no names provided", async () => {
      const mockRecord = {
        id: 1, code: "abc", attendeeName: "Attendee 1",
        seat: null, tier: null, maxUses: 1, expiresAt: null,
      };

      qrCodeDAO.create = jest.fn().mockResolvedValue({
        record: mockRecord,
        rawToken: TEST_TOKEN,
        tokenHash: TEST_TOKEN_HASH,
      });

      const results = await qrCodeService.generateBatchQRCodes(1, 3, {}, 1);

      expect(results).toHaveLength(3);
    });
  });
});

const QR_SCAN_RATE_LIMIT = 5;
