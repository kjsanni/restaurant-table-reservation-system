const { Sequelize } = require("sequelize");

jest.mock("../db/models", () => {
  const SequelizeLib = require("sequelize");
  const mockFn = jest.fn(() => "COUNT");
  const mockCol = jest.fn(() => "id");
  const mockCreate = jest.fn();
  const mockFindOne = jest.fn();
  const mockFindByPk = jest.fn();
  const mockUpdate = jest.fn();
  const mockDestroy = jest.fn();

  const MockPasswordResetToken = {
    create: mockCreate,
    findOne: mockFindOne,
    findByPk: mockFindByPk,
    update: mockUpdate,
    destroy: mockDestroy,
  };

  const MockUser = {};

  return {
    Sequelize: SequelizeLib,
    passwordResetToken: MockPasswordResetToken,
    user: MockUser,
    sequelize: {
      fn: mockFn,
      col: mockCol,
      Op: SequelizeLib.Op,
    },
  };
});

const passwordResetDAO = require("../DAOs/passwordReset.dao");
const db = require("../db/models");

describe("Password Reset DAO", () => {
  beforeEach(() => jest.clearAllMocks());

  it("creates a token with hashed value and expiry", async () => {
    db.passwordResetToken.create.mockResolvedValue({});
    const result = await passwordResetDAO.create({ userId: 1, ipAddress: "1.2.3.4", userAgent: "test" });

    expect(result.raw).toBeDefined();
    expect(result.raw.length).toBe(64);
    expect(result.expiresAt).toBeInstanceOf(Date);
    expect(db.passwordResetToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1,
        token: expect.any(String),
        ipAddress: "1.2.3.4",
        userAgent: "test",
      })
    );
  });

  it("finds a valid token", async () => {
    db.passwordResetToken.findOne.mockResolvedValue({
      id: 1,
      userId: 1,
      token: "hashed",
      expiresAt: new Date(Date.now() + 3600000),
      usedAt: null,
      user: { id: 1, email: "test@example.com" },
    });

    const result = await passwordResetDAO.findValidToken("rawtoken");

    expect(result).toBeDefined();
    expect(result.user.email).toBe("test@example.com");
  });

  it("returns null for expired or used token", async () => {
    db.passwordResetToken.findOne.mockResolvedValue(null);

    const result = await passwordResetDAO.findValidToken("rawtoken");

    expect(result).toBeNull();
  });

  it("marks a token as used", async () => {
    const mockToken = { id: 1, usedAt: null, save: jest.fn() };
    db.passwordResetToken.findByPk.mockResolvedValue(mockToken);

    const result = await passwordResetDAO.markUsed(1);

    expect(result).toBe(mockToken);
    expect(mockToken.usedAt).toBeInstanceOf(Date);
    expect(mockToken.save).toHaveBeenCalled();
  });

  it("invalidates all valid tokens for a user", async () => {
    db.passwordResetToken.update.mockResolvedValue([1]);

    await passwordResetDAO.invalidateUserTokens(1);

    expect(db.passwordResetToken.update).toHaveBeenCalledWith(
      { usedAt: expect.any(Date) },
      {
        where: {
          userId: 1,
          usedAt: null,
          expiresAt: { [db.Sequelize.Op.gt]: expect.any(Date) },
        },
      }
    );
  });

  it("cleans up expired used tokens", async () => {
    db.passwordResetToken.destroy.mockResolvedValue(5);

    await passwordResetDAO.cleanupExpired();

    expect(db.passwordResetToken.destroy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          expiresAt: { [db.Sequelize.Op.lt]: expect.any(Date) },
          usedAt: { [db.Sequelize.Op.ne]: null },
        },
      })
    );
  });
});
