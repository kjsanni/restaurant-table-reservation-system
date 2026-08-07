const passwordResetDAO = require("../DAOs/passwordReset.dao");
const authDAO = require("../DAOs/auth.dao");
const emailService = require("../services/emailService");
const { generateToken: _generateAuthToken } = require("../services/authService");
const platformAuditDAO = require("../tenant-platform/DAOs/platformAudit.dao");
const logger = require("../utils/logger");

const forgotPasswordHandler = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  const user = await authDAO.findUserByEmail(email);
  if (!user) {
    return res.status(200).json({
      success: true,
      message: "If an account exists, a reset link has been sent.",
    });
  }

  await passwordResetDAO.invalidateUserTokens(user.id);

  const { raw, _expiresAt } = await passwordResetDAO.create({
    userId: user.id,
    ipAddress: req.ip || req.connection?.remoteAddress || null,
    userAgent: req.get("user-agent") || null,
  });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${raw}`;

  try {
    await emailService.sendEmail({
      to: user.email,
      subject: "Reset your password",
      html: `<p>Hi ${user.firstName || user.username},</p>
             <p>Click the link below to reset your password. This link expires in 1 hour.</p>
             <p><a href="${resetUrl}">Reset Password</a></p>
             <p>If you didn't request this, ignore this email.</p>`,
    });
  } catch (err) {
    logger.error("Password reset email failed", { error: err.message, userId: user.id });
    return res.status(500).json({ success: false, message: "Failed to send reset email" });
  }

  await platformAuditDAO.log(
    req.user?.id || null,
    "auth.password_reset_requested",
    "user",
    user.id,
    req.tenant?.id || null,
    { email: user.email },
    req.ip
  );

  return res.status(200).json({
    success: true,
    message: "If an account exists, a reset link has been sent.",
  });
};

const resetPasswordHandler = async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ success: false, message: "Token and password are required" });
  }

  const tokenRecord = await passwordResetDAO.findValidToken(token);
  if (!tokenRecord) {
    return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
  }

  const hashedPassword = await authDAO.hashPassword(password);
  await authDAO.updateUserPassword(tokenRecord.user.id, hashedPassword);

  await passwordResetDAO.markUsed(tokenRecord.id);
  await passwordResetDAO.invalidateUserTokens(tokenRecord.user.id);

  await platformAuditDAO.log(
    tokenRecord.user.id,
    "auth.password_reset_completed",
    "user",
    tokenRecord.user.id,
    null,
    {},
    req.ip
  );

  return res.status(200).json({ success: true, message: "Password reset successful" });
};

module.exports = {
  forgotPasswordHandler,
  resetPasswordHandler,
};
