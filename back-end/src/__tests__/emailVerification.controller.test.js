"use strict";

jest.mock("../DAOs/emailVerification.dao", () => ({
  invalidateUserTokens: jest.fn(),
  create: jest.fn(),
  findValidToken: jest.fn(),
  markUsed: jest.fn(),
}));

jest.mock("../DAOs/auth.dao", () => ({
  findUserByEmail: jest.fn(),
  updateUser: jest.fn(),
}));

jest.mock("../services/emailService", () => ({
  sendEmail: jest.fn(),
}));

jest.mock("../tenant-platform/DAOs/platformAudit.dao", () => ({
  log: jest.fn(),
}));

const emailVerificationController = require("../controllers/emailVerification.controller");
const emailVerificationDAO = require("../DAOs/emailVerification.dao");
const authDAO = require("../DAOs/auth.dao");
const emailService = require("../services/emailService");
const platformAuditDAO = require("../tenant-platform/DAOs/platformAudit.dao");
const { makeRes } = require("./utils/test-response");

const VERIFICATION_TOKEN_TTL_MS = 86400000;

describe("emailVerification.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.FRONTEND_URL = "http://localhost:3000";
  });

  afterEach(() => {
    delete process.env.FRONTEND_URL;
  });

  describe("requestVerificationHandler", () => {
    it("returns 400 when email is missing", async () => {
      const req = { body: {} };
      const res = makeRes();

      await emailVerificationController.requestVerificationHandler(req, res.res);

      expect(res.res.status).toHaveBeenCalledWith(400);
      res.expectJson({ success: false, message: "Email is required" });
    });

    it("returns generic success when user does not exist", async () => {
      authDAO.findUserByEmail.mockResolvedValue(null);

      const req = { body: { email: "nonexistent@test.com" }, ip: "127.0.0.1" };
      const res = makeRes();

      await emailVerificationController.requestVerificationHandler(req, res.res);

      expect(res.res.status).toHaveBeenCalledWith(200);
      res.expectJson({
        success: true,
        message: "If an account exists, a verification email has been sent.",
      });
      expect(emailVerificationDAO.create).not.toHaveBeenCalled();
    });

    it("returns success when email is already verified", async () => {
      authDAO.findUserByEmail.mockResolvedValue({
        id: 1,
        email: "test@test.com",
        emailVerified: true,
      });

      const req = { body: { email: "test@test.com" }, ip: "127.0.0.1" };
      const res = makeRes();

      await emailVerificationController.requestVerificationHandler(req, res.res);

      expect(res.res.status).toHaveBeenCalledWith(200);
      res.expectJson({
        success: true,
        message: "Email is already verified. You can log in.",
      });
      expect(emailVerificationDAO.create).not.toHaveBeenCalled();
    });

    it("creates verification record and sends email for unverified user", async () => {
      authDAO.findUserByEmail.mockResolvedValue({
        id: 1,
        email: "test@test.com",
        emailVerified: false,
        firstName: "Test",
        username: "testuser",
      });
      emailVerificationDAO.create.mockResolvedValue({
        id: 1,
        userId: 1,
        email: "test@test.com",
        token: "new-verify-token",
        expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
      });

      const req = { body: { email: "test@test.com" }, ip: "127.0.0.1" };
      const res = makeRes();

      await emailVerificationController.requestVerificationHandler(req, res.res);

      expect(emailVerificationDAO.invalidateUserTokens).toHaveBeenCalledWith(1);
      expect(emailVerificationDAO.create).toHaveBeenCalledWith({
        userId: 1,
        email: "test@test.com",
      });
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "test@test.com",
          subject: "Verify your email address",
        })
      );
      expect(platformAuditDAO.log).toHaveBeenCalledWith(
        1,
        "auth.email_verification_requested",
        "user",
        1,
        null,
        { email: "test@test.com" },
        "127.0.0.1"
      );
      expect(res.res.status).toHaveBeenCalledWith(200);
      res.expectJson({
        success: true,
        message: "If an account exists, a verification email has been sent.",
      });
    });

    it("returns 500 when email sending fails", async () => {
      authDAO.findUserByEmail.mockResolvedValue({
        id: 1,
        email: "test@test.com",
        emailVerified: false,
        firstName: "Test",
        username: "testuser",
      });
      emailVerificationDAO.create.mockResolvedValue({
        id: 1,
        token: "token-123",
      });
      emailService.sendEmail.mockRejectedValue(new Error("SMTP error"));

      const req = { body: { email: "test@test.com" }, ip: "127.0.0.1" };
      const res = makeRes();

      await emailVerificationController.requestVerificationHandler(req, res.res);

      expect(res.res.status).toHaveBeenCalledWith(500);
      res.expectJson({ success: false, message: "Failed to send verification email" });
    });
  });

  describe("verifyEmailHandler", () => {
    it("returns 400 when token is missing", async () => {
      const req = { body: {} };
      const res = makeRes();

      await emailVerificationController.verifyEmailHandler(req, res.res);

      expect(res.res.status).toHaveBeenCalledWith(400);
      res.expectJson({ success: false, message: "Token is required" });
    });

    it("returns 400 for invalid or expired token", async () => {
      emailVerificationDAO.findValidToken.mockResolvedValue(null);

      const req = { body: { token: "invalid-token" } };
      const res = makeRes();

      await emailVerificationController.verifyEmailHandler(req, res.res);

      expect(emailVerificationDAO.findValidToken).toHaveBeenCalledWith("invalid-token");
      expect(res.res.status).toHaveBeenCalledWith(400);
      res.expectJson({ success: false, message: "Invalid or expired verification token" });
      expect(authDAO.updateUser).not.toHaveBeenCalled();
    });

    it("marks email as verified and invalidates other tokens", async () => {
      const mockRecord = {
        id: 1,
        userId: 1,
        email: "test@test.com",
        user: { id: 1, email: "test@test.com" },
      };
      emailVerificationDAO.findValidToken.mockResolvedValue(mockRecord);

      const req = { body: { token: "valid-token" }, ip: "127.0.0.1" };
      const res = makeRes();

      await emailVerificationController.verifyEmailHandler(req, res.res);

      expect(authDAO.updateUser).toHaveBeenCalledWith(1, { emailVerified: true });
      expect(emailVerificationDAO.markUsed).toHaveBeenCalledWith(1);
      expect(emailVerificationDAO.invalidateUserTokens).toHaveBeenCalledWith(1);
      expect(platformAuditDAO.log).toHaveBeenCalledWith(
        1,
        "auth.email_verified",
        "user",
        1,
        null,
        { email: "test@test.com" },
        "127.0.0.1"
      );
      expect(res.res.status).toHaveBeenCalledWith(200);
      res.expectJson({
        success: true,
        message: "Email verified successfully. You can now log in.",
      });
    });
  });
});
