const emailVerificationDAO = require("../DAOs/emailVerification.dao");
const authDAO = require("../DAOs/auth.dao");
const emailService = require("../services/emailService");
const platformAuditDAO = require("../tenant-platform/DAOs/platformAudit.dao");
const logger = require("../utils/logger");

const requestVerificationHandler = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  const user = await authDAO.findUserByEmail(email);
  if (!user) {
    return res.status(200).json({
      success: true,
      message: "If an account exists, a verification email has been sent.",
    });
  }

  if (user.emailVerified) {
    return res.status(200).json({
      success: true,
      message: "Email is already verified. You can log in.",
    });
  }

  await emailVerificationDAO.invalidateUserTokens(user.id);

  const record = await emailVerificationDAO.create({
    userId: user.id,
    email: user.email,
  });

  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${record.token}`;

  try {
    await emailService.sendEmail({
      to: user.email,
      subject: "Verify your email address",
      html: `<p>Hi ${user.firstName || user.username},</p>
             <p>Click the link below to verify your email address. This link expires in 24 hours.</p>
             <p><a href="${verifyUrl}">Verify Email</a></p>
             <p>If you didn't create an account, ignore this email.</p>`,
    });
  } catch (err) {
    logger.error("Verification email failed", { error: err.message, userId: user.id });
    return res.status(500).json({ success: false, message: "Failed to send verification email" });
  }

  await platformAuditDAO.log(
    user.id,
    "auth.email_verification_requested",
    "user",
    user.id,
    null,
    { email: user.email },
    req.ip
  );

  return res.status(200).json({
    success: true,
    message: "If an account exists, a verification email has been sent.",
  });
};

const verifyEmailHandler = async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ success: false, message: "Token is required" });
  }

  const record = await emailVerificationDAO.findValidToken(token);
  if (!record) {
    return res.status(400).json({ success: false, message: "Invalid or expired verification token" });
  }

  await authDAO.updateUser(record.user.id, { emailVerified: true });
  await emailVerificationDAO.markUsed(record.id);
  await emailVerificationDAO.invalidateUserTokens(record.user.id);

  await platformAuditDAO.log(
    record.user.id,
    "auth.email_verified",
    "user",
    record.user.id,
    null,
    { email: record.email },
    req.ip
  );

  return res.status(200).json({ success: true, message: "Email verified successfully. You can now log in." });
};

module.exports = {
  requestVerificationHandler,
  verifyEmailHandler,
};
