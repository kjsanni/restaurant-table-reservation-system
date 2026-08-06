const authController = require("../controllers/auth.controller");

jest.mock("../services/authService", () => ({
  registerUser: jest.fn(),
  generateToken: jest.fn((userId, role) => `token-${userId}`),
  generateRefreshToken: jest.fn(() => "refresh-token"),
}));

jest.mock("../DAOs/auth.dao", () => ({
  findUserByEmail: jest.fn(),
  createRefreshToken: jest.fn(),
}));

jest.mock("../services/customerService", () => ({
  findOrCreateCustomer: jest.fn(),
}));

jest.mock("../DAOs/emailVerification.dao", () => ({
  invalidateUserTokens: jest.fn(),
  create: jest.fn().mockResolvedValue({ token: "verify-token-123" }),
}));

jest.mock("../services/emailService", () => ({
  sendEmail: jest.fn(),
}));

jest.mock("../tenant-platform/DAOs/platformAudit.dao", () => ({
  log: jest.fn(),
}));

jest.mock("../db/models", () => ({
  sequelize: {
    transaction: jest.fn(async (fn) => fn({})),
  },
  Sequelize: {
    Op: {
      eq: "eq",
      ne: "ne",
      gt: "gt",
      lt: "lt",
      gte: "gte",
      lte: "lte",
      and: "and",
      or: "or",
      not: "not",
      like: "like",
      in: "in",
      notIn: "notIn",
      between: "between",
      notBetween: "notBetween",
      isNull: "isNull",
      isNotNull: "isNotNull",
      col: "col",
      lower: "lower",
      upper: "upper",
      substr: "substr",
      length: "length",
      trim: "trim",
      extract: "extract",
      now: "now",
      cast: "cast",
    },
  },
  User: {
    init: jest.fn(),
    associate: jest.fn(),
  },
  user: jest.fn(),
  role: jest.fn(),
  Reservation: jest.fn(),
  reservation: jest.fn(),
  Table: jest.fn(),
  table: jest.fn(),
  Group: jest.fn(),
  group: jest.fn(),
  Setting: jest.fn(),
  setting: jest.fn(),
  RefreshToken: jest.fn(),
  refreshToken: jest.fn(),
  Holiday: jest.fn(),
  holiday: jest.fn(),
  loginAttempt: {
    count: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

const authService = require("../services/authService");
const authDAO = require("../DAOs/auth.dao");
const customerService = require("../services/customerService");
const emailVerificationDAO = require("../DAOs/emailVerification.dao");
const emailService = require("../services/emailService");
const platformAuditDAO = require("../tenant-platform/DAOs/platformAudit.dao");
const db = require("../db/models");

function createReq(body = {}, tenantId = 1) {
  return {
    body,
    tenant: tenantId ? { id: tenantId } : null,
    secure: false,
    ip: "127.0.0.1",
    connection: { remoteAddress: "127.0.0.1" },
    socket: { remoteAddress: "127.0.0.1" },
  };
}

function createRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  return res;
}

describe("auth.controller — registerCustomerHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authService.generateToken.mockImplementation((userId, role) => `token-${userId}`);
    authService.generateRefreshToken.mockReturnValue("refresh-token");
    db.sequelize.transaction.mockImplementation(async (fn) => fn());
  });

  it("returns 400 when required fields are missing", async () => {
    const req = createReq({});
    const res = createRes();
    await authController.registerCustomerHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Please provide email, password, first name, last name, and phone.",
    });
  });

  it("returns 409 when email already exists", async () => {
    authDAO.findUserByEmail.mockResolvedValue({ id: 99, email: "exists@test.com" });
    const req = createReq({
      email: "exists@test.com",
      password: "Password123",
      firstName: "Jane",
      lastName: "Doe",
      phone: "0244000000",
    });
    const res = createRes();
    await authController.registerCustomerHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "An account with this email already exists.",
    });
  });

  it("creates customer user and customer record on success", async () => {
    authDAO.findUserByEmail.mockResolvedValue(null);
    authService.registerUser.mockResolvedValue({
      id: 10,
      username: "janedoe",
      email: "jane@test.com",
      role: "customer",
      permissions: {},
    });
    customerService.findOrCreateCustomer.mockResolvedValue({
      id: 5,
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@test.com",
      phone: "0244000000",
    });

    const req = createReq({
      email: "jane@test.com",
      password: "Password123",
      firstName: "Jane",
      lastName: "Doe",
      phone: "0244000000",
    });
    const res = createRes();

    await authController.registerCustomerHandler(req, res);

    expect(authService.registerUser).toHaveBeenCalledWith(
      authDAO,
      expect.objectContaining({
        username: "janedoe",
        email: "jane@test.com",
        password: "Password123",
      }),
      1,
      "customer"
    );
    expect(customerService.findOrCreateCustomer).toHaveBeenCalledWith(
      { firstName: "Jane", lastName: "Doe", email: "jane@test.com", phone: "0244000000" },
      1
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Account created! Please check your email to verify your address before logging in.",
      requiresVerification: true,
      email: "jane@test.com",
    });
    expect(emailVerificationDAO.create).toHaveBeenCalledWith({
      userId: 10,
      email: "jane@test.com",
    });
    expect(emailService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "jane@test.com",
        subject: "Verify your email address",
      })
    );
    expect(platformAuditDAO.log).toHaveBeenCalledWith(
      10,
      "auth.customer_registered",
      "user",
      10,
      1,
      { email: "jane@test.com" },
      "127.0.0.1"
    );
  });

  it("returns 500 when customer service fails inside transaction", async () => {
    authDAO.findUserByEmail.mockResolvedValue(null);
    authService.registerUser.mockResolvedValue({
      id: 11,
      username: "test",
      email: "test@test.com",
      role: "customer",
      permissions: {},
    });
    customerService.findOrCreateCustomer.mockRejectedValue(new Error("db failure"));

    const req = createReq({
      email: "test@test.com",
      password: "Password123",
      firstName: "Test",
      lastName: "User",
      phone: "0244000001",
    });
    const res = createRes();

    await authController.registerCustomerHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
