jest.mock("../services/authService", () => ({
  verifyToken: jest.fn(),
  generateToken: jest.fn((userId, role, locale) => `new-token-${userId}`),
  generateRefreshToken: jest.fn(() => "new-refresh-token"),
  loginUser: jest.fn(),
}));

jest.mock("../services/whatsapp.service");
jest.mock("../services/whatsapp-otp.service");
jest.mock("../DAOs/auth.dao");

const authService = require("../services/authService");
const authController = require("../controllers/auth.controller");
const whatsappService = require("../services/whatsapp.service");
const whatsappOtpService = require("../services/whatsapp-otp.service");
const authDAO = require("../DAOs/auth.dao");

const makeReq = (overrides = {}) => ({
  body: {},
  tenant: { id: 1 },
  secure: false,
  ip: "127.0.0.1",
  connection: { remoteAddress: "127.0.0.1" },
  socket: { remoteAddress: "127.0.0.1" },
  cookies: {},
  ...overrides,
});

const makeRes = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
  };
  return res;
};

describe("auth.controller — WhatsApp OTP login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.TOTP_BYPASS = "false";
    authService.verifyToken.mockReturnValue({ userId: 1 });

    authDAO.findUserById.mockResolvedValue({
      id: 1,
      username: "staff1",
      email: "staff@test.com",
      role: "staff",
      permissions: {},
      locale: "en",
      isSuperAdmin: false,
      platformRoles: [],
      tenantId: 1,
      emailVerified: true,
      phone: "+233241234567",
      firstLoginCompleted: true,
    });

    authDAO.createRefreshToken.mockResolvedValue({});
    authDAO.findUserByEmail.mockResolvedValue({
      id: 1,
      username: "staff1",
      email: "staff@test.com",
      role: "staff",
      permissions: {},
      locale: "en",
      isSuperAdmin: false,
      platformRoles: [],
      tenantId: 1,
      emailVerified: true,
      password: "hashed",
      phone: "+233241234567",
      firstLoginCompleted: true,
    });
    authDAO.comparePassword.mockResolvedValue(true);
    authDAO.checkLoginLockout.mockResolvedValue({ locked: false });
    authDAO.clearLoginAttempts.mockResolvedValue(undefined);
    authDAO.updateUser.mockResolvedValue({});

    authService.loginUser.mockResolvedValue({
      token: "access-token",
      refreshToken: "refresh-token",
      user: {
        id: 1,
        username: "staff1",
        email: "staff@test.com",
        role: "staff",
        permissions: {},
        isSuperAdmin: false,
        platformRoles: [],
        emailVerified: true,
      },
    });
  });

  describe("loginHandler", () => {
    it("returns pendingWhatsAppOTP when tenant WhatsApp is enabled and staff has phone", async () => {
      whatsappService.isTenantWhatsAppEnabled.mockResolvedValue(true);
      whatsappOtpService.generateOTP.mockResolvedValue("123456");
      whatsappService.sendLoginOTP.mockResolvedValue({});

      const req = makeReq({ body: { email: "staff@test.com", password: "pw" } });
      const res = makeRes();

      await authController.loginHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          pendingWhatsAppOTP: true,
          tempToken: expect.any(String),
        })
      );
      expect(whatsappService.sendLoginOTP).toHaveBeenCalledWith(
        "+233241234567",
        "123456",
        1
      );
    });

    it("falls back to normal login when WhatsApp is not enabled", async () => {
      whatsappService.isTenantWhatsAppEnabled.mockResolvedValue(false);

      const req = makeReq({ body: { email: "staff@test.com", password: "pw" } });
      const res = makeRes();

      await authController.loginHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Login successful!",
        })
      );
      expect(res.cookie).toHaveBeenCalledWith("token", expect.any(String), expect.any(Object));
    });

    it("falls back to normal login when staff has no phone", async () => {
      authDAO.findUserByEmail.mockResolvedValue({
        id: 1,
        username: "staff1",
        email: "staff@test.com",
        role: "staff",
        permissions: {},
        locale: "en",
        isSuperAdmin: false,
        platformRoles: [],
        tenantId: 1,
        emailVerified: true,
        password: "hashed",
        phone: null,
        firstLoginCompleted: true,
      });
      authDAO.findUserById.mockResolvedValue({
        id: 1,
        username: "staff1",
        email: "staff@test.com",
        role: "staff",
        permissions: {},
        locale: "en",
        isSuperAdmin: false,
        platformRoles: [],
        tenantId: 1,
        emailVerified: true,
        phone: null,
        firstLoginCompleted: true,
      });
      whatsappService.isTenantWhatsAppEnabled.mockResolvedValue(true);

      const req = makeReq({ body: { email: "staff@test.com", password: "pw" } });
      const res = makeRes();

      await authController.loginHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Login successful!",
        })
      );
    });

    it("marks firstLoginCompleted on first login", async () => {
      const firstLoginUser = {
        id: 1,
        username: "staff1",
        email: "staff@test.com",
        role: "staff",
        permissions: {},
        locale: "en",
        isSuperAdmin: false,
        platformRoles: [],
        tenantId: 1,
        emailVerified: true,
        password: "hashed",
        phone: "+233241234567",
        firstLoginCompleted: false,
      };
      authDAO.findUserByEmail.mockResolvedValue(firstLoginUser);
      authDAO.findUserById.mockResolvedValue(firstLoginUser);
      whatsappService.isTenantWhatsAppEnabled.mockResolvedValue(true);

      const req = makeReq({ body: { email: "staff@test.com", password: "pw" } });
      const res = makeRes();

      await authController.loginHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Login successful!",
        })
      );
      expect(authDAO.updateUser).toHaveBeenCalledWith(
        1,
        { firstLoginCompleted: true },
        1
      );
    });

    it("returns 502 when WhatsApp OTP send fails", async () => {
      whatsappService.isTenantWhatsAppEnabled.mockResolvedValue(true);
      whatsappOtpService.generateOTP.mockResolvedValue("123456");
      whatsappService.sendLoginOTP.mockRejectedValue(new Error("WhatsApp API error"));

      const req = makeReq({ body: { email: "staff@test.com", password: "pw" } });
      const res = makeRes();

      await authController.loginHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(502);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "WhatsApp OTP delivery failed. Contact your administrator.",
        })
      );
    });
  });

  describe("loginWhatsAppOTPHandler", () => {
    it("issues tokens on valid OTP", async () => {
      whatsappOtpService.verifyOTP.mockResolvedValue({ valid: true });

      const req = makeReq({ body: { tempToken: "valid-temp-token", code: "123456" } });
      const res = makeRes();

      await authController.loginWhatsAppOTPHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.cookie).toHaveBeenCalledWith("token", expect.any(String), expect.any(Object));
      expect(res.cookie).toHaveBeenCalledWith("refreshToken", expect.any(String), expect.any(Object));
    });

    it("returns 400 on invalid OTP", async () => {
      whatsappOtpService.verifyOTP.mockResolvedValue({ valid: false, reason: "invalid_code" });

      const req = makeReq({ body: { tempToken: "valid-temp-token", code: "000000" } });
      const res = makeRes();

      await authController.loginWhatsAppOTPHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Invalid OTP code",
        })
      );
    });

    it("returns 400 when tempToken is missing", async () => {
      const req = makeReq({ body: { code: "123456" } });
      const res = makeRes();

      await authController.loginWhatsAppOTPHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Temporary token and OTP code are required",
        })
      );
    });
  });
});
