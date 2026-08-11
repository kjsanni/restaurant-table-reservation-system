const generateTestSecret = () => `test-secret-${Date.now()}-${Math.random().toString(36).slice(2)}`;

process.env.JWT_SECRET = generateTestSecret();
process.env.JWT_SECRET_PREVIOUS = generateTestSecret();
process.env.REFRESH_TOKEN_SECRET = generateTestSecret();

jest.mock("../DAOs/auth.dao");
jest.mock("../DAOs/role.dao");

const authDAO = require("../DAOs/auth.dao");
const roleDAO = require("../DAOs/role.dao");

const {
  generateToken,
  verifyToken,
  generateRefreshToken,
  loginUser,
  registerUser,
  refreshAccessToken,
  revokeRefreshToken,
  revokeAllUserTokens,
} = require("../services/authService");

const makeUser = (overrides = {}) => ({
  id: 1,
  username: "testuser",
  email: "test@test.com",
  role: "staff",
  permissions: {},
  isSuperAdmin: false,
  platformRoles: [],
  ...overrides,
});

describe("auth.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.JWT_SECRET_PREVIOUS;
    delete process.env.REFRESH_TOKEN_SECRET;
  });

  describe("generateToken", () => {
    it("returns a JWT with userId and role", () => {
      const token = generateToken(1, "staff");
      const decoded = require("jsonwebtoken").verify(token, process.env.JWT_SECRET);
      expect(decoded.userId).toBe(1);
      expect(decoded.role).toBe("staff");
    });
  });

  describe("generateRefreshToken", () => {
    it("returns a 128-character hex string", () => {
      const token = generateRefreshToken();
      expect(token).toHaveLength(128);
      expect(token).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe("verifyToken", () => {
    it("verifies a valid token", () => {
      const token = generateToken(1, "staff");
      const decoded = verifyToken(token);
      expect(decoded.userId).toBe(1);
    });
  });

  describe("loginUser", () => {
    it("returns token and user on valid credentials", async () => {
      authDAO.findUserByEmail.mockResolvedValue(makeUser({ password: "hashed" }));
      authDAO.comparePassword.mockResolvedValue(true);
      authDAO.checkLoginLockout.mockResolvedValue({ locked: false });
      authDAO.clearLoginAttempts.mockResolvedValue(undefined);
      roleDAO.getRolePermissions.mockResolvedValue({ view_reservations: true });

      const result = await loginUser(authDAO, { email: "test@test.com", password: "pw" }, null, null, "1.2.3.4");

      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe("test@test.com");
      expect(result.user.permissions).toEqual({ view_reservations: true });
    });

    it("throws 401 on invalid email", async () => {
      authDAO.findUserByEmail.mockResolvedValue(null);

      await expect(
        loginUser(authDAO, { email: "bad@test.com", password: "pw" }, null)
      ).rejects.toMatchObject({ status: 401, message: "Invalid credentials!" });
    });

    it("throws 401 on invalid password", async () => {
      authDAO.findUserByEmail.mockResolvedValue(makeUser());
      authDAO.comparePassword.mockResolvedValue(false);

      await expect(
        loginUser(authDAO, { email: "test@test.com", password: "wrong" }, null)
      ).rejects.toMatchObject({ status: 401, message: "Invalid credentials!" });
    });

    it("records failed login when password is wrong and IP is provided", async () => {
      authDAO.findUserByEmail.mockResolvedValue(makeUser());
      authDAO.comparePassword.mockResolvedValue(false);
      authDAO.recordFailedLogin.mockResolvedValue(undefined);

      await expect(
        loginUser(authDAO, { email: "test@test.com", password: "wrong" }, null, null, "1.2.3.4")
      ).rejects.toMatchObject({ status: 401 });

      expect(authDAO.recordFailedLogin).toHaveBeenCalledWith("test@test.com", "1.2.3.4", null);
    });

    it("returns pendingTOTP for super admin without confirmed TOTP", async () => {
      authDAO.findUserByEmail.mockResolvedValue(
        makeUser({ isSuperAdmin: true, totpEnabled: true, totpConfirmed: false })
      );
      authDAO.comparePassword.mockResolvedValue(true);

      const result = await loginUser(authDAO, { email: "super@test.com", password: "pw" }, null);

      expect(result.pendingTOTP).toBe(true);
      expect(result.tempToken).toBeDefined();
    });

    it("falls back to inline permissions when role DAO fails", async () => {
      authDAO.findUserByEmail.mockResolvedValue(makeUser({ role: "manager" }));
      authDAO.comparePassword.mockResolvedValue(true);
      roleDAO.getRolePermissions.mockRejectedValue(new Error("DB error"));

      const result = await loginUser(authDAO, { email: "test@test.com", password: "pw" }, null);

      expect(result.user.permissions).toBeDefined();
      expect(Object.keys(result.user.permissions).length).toBeGreaterThan(0);
    });
  });

  describe("refreshAccessToken", () => {
    it("returns new tokens when refresh token is valid", async () => {
      const refreshTokenDAO = {
        findValidRefreshToken: jest.fn().mockResolvedValue({ userId: 1 }),
        findUserById: jest.fn().mockResolvedValue(makeUser()),
        createRefreshToken: jest.fn().mockResolvedValue({}),
        revokeRefreshToken: jest.fn().mockResolvedValue({}),
      };
      roleDAO.getRolePermissions.mockResolvedValue(null);

      const result = await refreshAccessToken(refreshTokenDAO, "valid-refresh", null);

      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.id).toBe(1);
    });

    it("throws 401 when refresh token is missing", async () => {
      await expect(refreshAccessToken(null, null, null)).rejects.toMatchObject({
        status: 401,
        message: "Refresh token is required!",
      });
    });

    it("throws 401 when refresh token is not found", async () => {
      const refreshTokenDAO = {
        findValidRefreshToken: jest.fn().mockResolvedValue(null),
      };

      await expect(refreshAccessToken(refreshTokenDAO, "bad-refresh", null)).rejects.toMatchObject({
        status: 401,
        message: "Invalid or expired refresh token!",
      });
    });
  });

  describe("revokeRefreshToken", () => {
    it("delegates to DAO", async () => {
      const refreshTokenDAO = { revokeRefreshToken: jest.fn().mockResolvedValue({}) };
      await revokeRefreshToken(refreshTokenDAO, "rt", null);
      expect(refreshTokenDAO.revokeRefreshToken).toHaveBeenCalledWith("rt", null);
    });
  });

  describe("revokeAllUserTokens", () => {
    it("delegates to DAO", async () => {
      const refreshTokenDAO = { revokeAllUserTokens: jest.fn().mockResolvedValue({}) };
      await revokeAllUserTokens(refreshTokenDAO, 1, null);
      expect(refreshTokenDAO.revokeAllUserTokens).toHaveBeenCalledWith(1, null);
    });
  });

  describe("registerUser", () => {
    it("requires email, username, and password", async () => {
      await expect(registerUser(authDAO, {}, null)).rejects.toMatchObject({
        status: 400,
        message: "Please provide username, email, and password!",
      });
    });

    it("creates user with hashed password", async () => {
      authDAO.createUser.mockResolvedValue({ id: 2, username: "newuser" });
      const hashedPassword = `hashed-${Math.random().toString(36).slice(2)}`;
      authDAO.hashPassword.mockResolvedValue(hashedPassword);
      authDAO.validatePasswordComplexity.mockReturnValue([]);

      const result = await registerUser(
        authDAO,
        { username: "newuser", email: "new@test.com", password: "Pw123!" },
        null,
        "staff"
      );

      expect(result.id).toBe(2);
      expect(authDAO.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ username: "newuser", email: "new@test.com", password: hashedPassword }),
        null,
        {}
      );
    });
  });
});
