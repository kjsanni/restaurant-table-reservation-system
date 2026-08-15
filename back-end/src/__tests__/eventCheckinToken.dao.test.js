"use strict";

jest.mock("../db/models", () => {
  const SequelizeLib = require("sequelize");
  const mockFn = jest.fn(() => "COUNT");
  const mockCol = jest.fn(() => "id");

  const mockCreate = jest.fn();
  const mockFindOne = jest.fn();
  const mockFindAndCountAll = jest.fn();
  const mockUpdate = jest.fn();
  const mockDestroy = jest.fn();
  const mockIncrement = jest.fn();

  const MockQRCode = {
    create: mockCreate,
    findOne: mockFindOne,
    findAndCountAll: mockFindAndCountAll,
    update: mockUpdate,
    destroy: mockDestroy,
  };

  const MockAuditLog = {
    create: jest.fn().mockResolvedValue({}),
  };

  const MockSequelize = {
    fn: mockFn,
    col: mockCol,
    Op: SequelizeLib.Op,
    transaction: jest.fn(),
    lock: { update: "UPDATE" },
  };

  const mockQrCodeInstance = {
    id: 1,
    increment: mockIncrement,
    update: jest.fn(),
    save: jest.fn(),
    toJSON: jest.fn().mockReturnValue({ id: 1, status: "active" }),
  };

  mockIncrement.mockResolvedValue(1);
  mockQrCodeInstance.update.mockResolvedValue(mockQrCodeInstance);

  return {
    Sequelize: SequelizeLib,
    QRCode: MockQRCode,
    AuditLog: MockAuditLog,
    sequelize: MockSequelize,
    Op: SequelizeLib.Op,
  };
});

jest.mock("../utils/redis", () => ({
  acquireLock: jest.fn(),
  releaseLock: jest.fn(),
}));

jest.mock("../utils/cache", () => ({
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(true),
  del: jest.fn().mockResolvedValue(1),
}));

jest.mock("../middleware/auditLog", () => ({
  logAction: jest.fn(),
}));

const db = require("../db/models");
const { acquireLock, releaseLock } = require("../utils/redis");
const qrCodeDAO = require("../verticals/event/DAOs/qrCode.dao");

describe("QRCode DAO (Security-Enhanced)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    acquireLock.mockResolvedValue({ acquired: true, reason: "acquired" });
    releaseLock.mockResolvedValue({ released: true });
  });

  describe("token hashing", () => {
    it("hashToken produces 64-char SHA-256 hex", () => {
      const raw = qrCodeDAO.generateRawToken();
      const hash = qrCodeDAO.hashToken(raw);
      expect(hash).toHaveLength(64);
      expect(hash).not.toBe(raw);
    });

    it("hashToken is deterministic", () => {
      const raw = "a".repeat(64);
      expect(qrCodeDAO.hashToken(raw)).toBe(qrCodeDAO.hashToken(raw));
    });

    it("different inputs produce different hashes", () => {
      expect(qrCodeDAO.hashToken("a".repeat(64))).not.toBe(
        qrCodeDAO.hashToken("b".repeat(64))
      );
    });
  });

  describe("create", () => {
    it("generates rawToken and stores only tokenHash", async () => {
      const mockRecord = {
        id: 1,
        code: "abc123",
        tokenHash: "hashed",
        toJSON: jest.fn().mockReturnValue({ id: 1 }),
      };
      db.QRCode.create.mockResolvedValue(mockRecord);

      const result = await qrCodeDAO.create({
        eventId: 1,
        tenantId: 1,
        attendeeName: "John Doe",
      });

      expect(result.rawToken).toBeDefined();
      expect(result.rawToken).toHaveLength(64);
      expect(result.tokenHash).toHaveLength(64);
      expect(db.QRCode.create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventId: 1,
          tenantId: 1,
          tokenHash: result.tokenHash,
          attendeeName: "John Doe",
          status: "active",
          maxUses: 1,
          usedCount: 0,
        })
      );
      expect(db.QRCode.create.mock.calls[0][0].tokenHash).not.toBe(
        result.rawToken
      );
    });

    it("uses provided code if no code field given (falls back to hash prefix)", async () => {
      db.QRCode.create.mockResolvedValue({ id: 1, code: "abc" });

      const result = await qrCodeDAO.create({
        eventId: 1,
        tenantId: 1,
      });

      expect(db.QRCode.create).toHaveBeenCalled();
      expect(result.rawToken).toBeDefined();
    });
  });

  describe("findByTokenHash", () => {
    it("scopes query by tenantId when provided", async () => {
      db.QRCode.findOne.mockResolvedValue({ id: 1 });
      await qrCodeDAO.findByTokenHash("hash123", 1);
      expect(db.QRCode.findOne).toHaveBeenCalledWith({
        where: { tokenHash: "hash123", tenantId: 1 },
      });
    });

    it("skips tenant scoping when tenantId is falsy", async () => {
      db.QRCode.findOne.mockResolvedValue({ id: 1 });
      await qrCodeDAO.findByTokenHash("hash123");
      expect(db.QRCode.findOne).toHaveBeenCalledWith({
        where: { tokenHash: "hash123" },
      });
    });
  });

  describe("markUsedAtomic", () => {
    it("acquires Redis lock before transaction", async () => {
      const mockQr = {
        id: 1,
        usedCount: 0,
        maxUses: 1,
        status: "active",
        expiresAt: null,
        validFrom: null,
        increment: jest.fn().mockResolvedValue([1]),
        update: jest.fn().mockResolvedValue(),
        toJSON: jest.fn().mockReturnValue({ id: 1, status: "active" }),
      };

      db.sequelize.transaction = jest.fn().mockImplementation(async (cb) => {
        return cb({ LOCK: { UPDATE: "UPDATE" } });
      });

      db.QRCode.findOne.mockResolvedValue(mockQr);

      await qrCodeDAO.markUsedAtomic("hash123", 1, 5);

      expect(acquireLock).toHaveBeenCalledWith("qr_checkin:hash123", 30);
    });

    it("releases Redis lock in finally block", async () => {
      db.sequelize.transaction = jest.fn().mockImplementation(async (cb) => {
        return cb({ LOCK: { UPDATE: "UPDATE" } });
      });
      db.QRCode.findOne.mockResolvedValue(null);

      await qrCodeDAO.markUsedAtomic("hash123", 1, 5);

      expect(releaseLock).toHaveBeenCalledWith("qr_checkin:hash123");
    });

    it("returns locked result when Redis lock unavailable", async () => {
      acquireLock.mockResolvedValue({ acquired: false, reason: "redis_unavailable" });

      const result = await qrCodeDAO.markUsedAtomic("hash123", 1, 5);

      expect(result).toEqual({ locked: true, reason: "redis_unavailable" });
      expect(db.QRCode.findOne).not.toHaveBeenCalled();
      expect(releaseLock).not.toHaveBeenCalled();
    });

    it("returns null when token not found", async () => {
      db.sequelize.transaction = jest.fn().mockImplementation(async (cb) => {
        return cb({ LOCK: { UPDATE: "UPDATE" } });
      });
      db.QRCode.findOne.mockResolvedValue(null);

      const result = await qrCodeDAO.markUsedAtomic("hash123", 1, 5);

      expect(result).toBeNull();
    });

    it("returns alreadyUsed when usedCount >= maxUses", async () => {
      const mockQr = {
        id: 1,
        usedCount: 1,
        maxUses: 1,
        status: "used",
        expiresAt: null,
        validFrom: null,
        increment: jest.fn().mockResolvedValue([1]),
        update: jest.fn().mockResolvedValue(),
        toJSON: jest.fn().mockReturnValue({ id: 1, usedCount: 1, maxUses: 1, status: "used" }),
      };

      db.sequelize.transaction = jest.fn().mockImplementation(async (cb) => {
        return cb({ LOCK: { UPDATE: "UPDATE" } });
      });
      db.QRCode.findOne.mockResolvedValue(mockQr);

      const result = await qrCodeDAO.markUsedAtomic("hash123", 1, 5);

      expect(result.alreadyUsed).toBe(true);
      expect(mockQr.increment).not.toHaveBeenCalled();
    });

    it("returns expired when token has expired", async () => {
      const mockQr = {
        id: 1,
        usedCount: 0,
        maxUses: 1,
        status: "active",
        expiresAt: new Date(Date.now() - 1000),
        validFrom: null,
        increment: jest.fn().mockResolvedValue([1]),
        update: jest.fn().mockResolvedValue(),
        toJSON: jest.fn().mockReturnValue({ id: 1, status: "active", expiresAt: new Date(Date.now() - 1000) }),
      };

      db.sequelize.transaction = jest.fn().mockImplementation(async (cb) => {
        return cb({ LOCK: { UPDATE: "UPDATE" } });
      });
      db.QRCode.findOne.mockResolvedValue(mockQr);

      const result = await qrCodeDAO.markUsedAtomic("hash123", 1, 5);

      expect(result.expired).toBe(true);
      expect(mockQr.increment).not.toHaveBeenCalled();
    });

    it("returns notYetValid when validFrom is in the future", async () => {
      const mockQr = {
        id: 1,
        usedCount: 0,
        maxUses: 1,
        status: "active",
        expiresAt: null,
        validFrom: new Date(Date.now() + 3600000),
        increment: jest.fn().mockResolvedValue([1]),
        update: jest.fn().mockResolvedValue(),
        toJSON: jest.fn().mockReturnValue({ id: 1, status: "active", validFrom: new Date(Date.now() + 3600000) }),
      };

      db.sequelize.transaction = jest.fn().mockImplementation(async (cb) => {
        return cb({ LOCK: { UPDATE: "UPDATE" } });
      });
      db.QRCode.findOne.mockResolvedValue(mockQr);

      const result = await qrCodeDAO.markUsedAtomic("hash123", 1, 5);

      expect(result.notYetValid).toBe(true);
    });

    it("marks token as used and increments counter atomically", async () => {
      const mockQr = {
        id: 1,
        usedCount: 0,
        maxUses: 1,
        status: "active",
        expiresAt: null,
        validFrom: null,
        eventId: 5,
        guestListId: null,
        increment: jest.fn().mockResolvedValue([1]),
        update: jest.fn().mockResolvedValue(),
        toJSON: jest.fn().mockReturnValue({ id: 1, status: "active" }),
      };

      db.sequelize.transaction = jest.fn().mockImplementation(async (cb) => {
        return cb({ LOCK: { UPDATE: "UPDATE" } });
      });
      db.QRCode.findOne.mockResolvedValue(mockQr);

      const result = await qrCodeDAO.markUsedAtomic("hash123", 1, 5);

      expect(mockQr.increment).toHaveBeenCalledWith("usedCount", { transaction: expect.anything() });
      expect(mockQr.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "used",
          checkedInById: 5,
        }),
        expect.objectContaining({ transaction: expect.anything() })
      );
    });

    it("scopes query by tenantId", async () => {
      const mockQr = {
        id: 1,
        usedCount: 999,
        maxUses: 1,
        status: "used",
        expiresAt: null,
        validFrom: null,
        increment: jest.fn(),
        update: jest.fn(),
        toJSON: jest.fn().mockReturnValue({ id: 1, usedCount: 999 }),
      };

      db.sequelize.transaction = jest.fn().mockImplementation(async (cb) => {
        return cb({ LOCK: { UPDATE: "UPDATE" } });
      });
      db.QRCode.findOne.mockResolvedValue(mockQr);

      await qrCodeDAO.markUsedAtomic("hash123", 42, 5);

      expect(db.QRCode.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tokenHash: "hash123", tenantId: 42 },
        })
      );
    });
  });
});
