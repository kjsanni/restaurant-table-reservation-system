jest.mock("../db/models", () => {
  const SequelizeLib = require("sequelize");
  const mockFn = jest.fn(() => "COUNT");
  const mockCol = jest.fn(() => "id");
  const mockCreate = jest.fn();
  const mockFindOne = jest.fn();
  const mockFindByPk = jest.fn();
  const mockUpdate = jest.fn();
  const mockDestroy = jest.fn();

  const MockEmailVerification = {
    create: mockCreate,
    findOne: mockFindOne,
    findByPk: mockFindByPk,
    update: mockUpdate,
    destroy: mockDestroy,
  };

  return {
    Sequelize: SequelizeLib,
    emailVerification: MockEmailVerification,
    sequelize: {
      fn: mockFn,
      col: mockCol,
      Op: SequelizeLib.Op,
    },
  };
});

const emailVerificationDAO = require("../DAOs/emailVerification.dao");
const db = require("../db/models");

describe("Email Verification DAO", () => {
  beforeEach(() => jest.clearAllMocks());

  it("creates a verification record and invalidates old tokens", async () => {
    db.emailVerification.create.mockResolvedValue({
      id: 1,
      userId: 1,
      email: "test@test.com",
      token: "new-token",
      expiresAt: new Date(Date.now() + 86400000),
    });

    const result = await emailVerificationDAO.create({ userId: 1, email: "test@test.com" });

    expect(result).toBeDefined();
    expect(result.token).toBe("new-token");
    expect(db.emailVerification.update).toHaveBeenCalledWith(
      { usedAt: expect.any(Date) },
      { where: { userId: 1, usedAt: { [db.Sequelize.Op.eq]: null } } }
    );
    expect(db.emailVerification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1,
        email: "test@test.com",
        token: expect.any(String),
        expiresAt: expect.any(Date),
      })
    );
  });

  it("finds a valid token with user", async () => {
    db.emailVerification.findOne.mockResolvedValue({
      id: 1,
      userId: 1,
      token: "valid-token",
      expiresAt: new Date(Date.now() + 3600000),
      usedAt: null,
      user: { id: 1, email: "test@test.com" },
    });

    const result = await emailVerificationDAO.findValidToken("valid-token");

    expect(result).toBeDefined();
    expect(result.user.email).toBe("test@test.com");
    expect(db.emailVerification.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          token: "valid-token",
          usedAt: null,
          expiresAt: { [db.Sequelize.Op.gt]: expect.any(Date) },
        },
        include: [{ model: db.user, as: "user" }],
      })
    );
  });

  it("returns null for invalid or expired token", async () => {
    db.emailVerification.findOne.mockResolvedValue(null);

    const result = await emailVerificationDAO.findValidToken("invalid-token");

    expect(result).toBeNull();
  });

  it("marks a token as used", async () => {
    const mockToken = { id: 1, usedAt: null, save: jest.fn() };
    db.emailVerification.findByPk.mockResolvedValue(mockToken);

    const result = await emailVerificationDAO.markUsed(1);

    expect(result).toBe(mockToken);
    expect(mockToken.usedAt).toBeInstanceOf(Date);
    expect(mockToken.save).toHaveBeenCalled();
  });

  it("invalidates all valid tokens for a user", async () => {
    db.emailVerification.update.mockResolvedValue([2]);

    await emailVerificationDAO.invalidateUserTokens(1);

    expect(db.emailVerification.update).toHaveBeenCalledWith(
      { usedAt: expect.any(Date) },
      {
        where: {
          userId: 1,
          usedAt: { [db.Sequelize.Op.eq]: null },
        },
      }
    );
  });

  it("cleans up expired tokens", async () => {
    db.emailVerification.destroy.mockResolvedValue(3);

    await emailVerificationDAO.cleanupExpired();

    expect(db.emailVerification.destroy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          expiresAt: { [db.Sequelize.Op.lt]: expect.any(Date) },
        },
      })
    );
  });
});
