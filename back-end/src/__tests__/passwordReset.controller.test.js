const {
  forgotPasswordHandler,
  resetPasswordHandler,
} = require("../controllers/passwordReset.controller");

jest.mock("../DAOs/passwordReset.dao", () => ({
  create: jest.fn(),
  findValidToken: jest.fn(),
  markUsed: jest.fn(),
  invalidateUserTokens: jest.fn(),
  cleanupExpired: jest.fn(),
}));

jest.mock("../DAOs/auth.dao", () => ({
  findUserByEmail: jest.fn(),
  updateUserPassword: jest.fn(),
  hashPassword: jest.fn().mockResolvedValue("hashed"),
}));

jest.mock("../services/emailService", () => ({
  sendEmail: jest.fn(),
}));

jest.mock("../tenant-platform/DAOs/platformAudit.dao", () => ({
  log: jest.fn(),
}));

const passwordResetDAO = require("../DAOs/passwordReset.dao");
const authDAO = require("../DAOs/auth.dao");
const emailService = require("../services/emailService");
const { createRes } = require("./utils/test-response");

describe("Password Reset Controller", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("forgotPasswordHandler", () => {
    it("returns 200 and sends email when user exists", async () => {
      authDAO.findUserByEmail.mockResolvedValue({
        id: 1,
        email: "test@example.com",
        firstName: "Test",
        username: "test",
      });
      passwordResetDAO.invalidateUserTokens.mockResolvedValue(undefined);
      passwordResetDAO.create.mockResolvedValue({
        raw: "tokenraw",
        expiresAt: new Date(Date.now() + 3600000),
      });
      emailService.sendEmail.mockResolvedValue({ messageId: "123" });

      const req = { body: { email: "test@example.com" }, ip: "127.0.0.1", get: () => "test-agent", tenant: null, user: { id: 1 } };
      const res = createRes();

      await forgotPasswordHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: expect.any(String) })
      );
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "test@example.com",
          subject: "Reset your password",
        })
      );
      expect(passwordResetDAO.invalidateUserTokens).toHaveBeenCalledWith(1);
    });

    it("returns 200 without sending email when user does not exist", async () => {
      authDAO.findUserByEmail.mockResolvedValue(null);

      const req = { body: { email: "nobody@example.com" }, ip: "127.0.0.1", get: () => "test-agent", tenant: null };
      const res = createRes();

      await forgotPasswordHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
      expect(emailService.sendEmail).not.toHaveBeenCalled();
    });

    it("returns 400 when email is missing", async () => {
      const req = { body: {}, ip: "127.0.0.1", get: () => "test-agent", tenant: null };
      const res = createRes();

      await forgotPasswordHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });
  });

  describe("resetPasswordHandler", () => {
    it("resets password and marks token as used", async () => {
      const mockUser = { id: 1, update: jest.fn() };
      passwordResetDAO.findValidToken.mockResolvedValue({
        id: 1,
        user: mockUser,
      });
      authDAO.updateUserPassword.mockResolvedValue(undefined);
      passwordResetDAO.markUsed.mockResolvedValue({ id: 1 });
      passwordResetDAO.invalidateUserTokens.mockResolvedValue(undefined);

      const req = { body: { token: "validtoken", password: "newpass123" }, ip: "127.0.0.1", tenant: null };
      const res = createRes();

      await resetPasswordHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: expect.any(String) })
      );
      expect(authDAO.updateUserPassword).toHaveBeenCalledWith(1, expect.any(String));
      expect(passwordResetDAO.markUsed).toHaveBeenCalledWith(1);
      expect(passwordResetDAO.invalidateUserTokens).toHaveBeenCalledWith(1);
    });

    it("returns 400 for invalid or expired token", async () => {
      passwordResetDAO.findValidToken.mockResolvedValue(null);

      const req = { body: { token: "badtoken", password: "newpass123" }, ip: "127.0.0.1", tenant: null };
      const res = createRes();

      await resetPasswordHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });

    it("returns 400 when token or password is missing", async () => {
      const req = { body: {}, ip: "127.0.0.1", tenant: null };
      const res = createRes();

      await resetPasswordHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });
  });
});
