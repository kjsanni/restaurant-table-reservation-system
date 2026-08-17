const response = require("../utils/response");

const authDAO = require("../../DAOs/auth.dao");
const totpService = require("../../services/totp.service");

const setupTOTPHandler = async (req, res) => {
  if (!req.user?.isSuperAdmin) {
    return response.forbidden(res, "Super admin access required");
  }

  const secret = totpService.generateSecret();
  const backupCodes = totpService.generateBackupCodes(10);
  const hashedCodes = totpService.hashBackupCodes(backupCodes);
  const user = await authDAO.findUserById(req.user.id, req.tenant?.id);
  if (!user) {
    return response.notFound(res, "User not found");
  }

  await authDAO.updateUser(req.user.id, {
    totpSecret: secret.base32,
    totpBackupCodes: JSON.stringify(hashedCodes),
  });

  res.status(200).json({
    success: true,
    secret: secret.base32,
    otpauthUrl: totpService.getTOTPUri(secret),
    backupCodes,
  });
};

const confirmTOTPHandler = async (req, res) => {
  if (!req.user?.isSuperAdmin) {
    return response.forbidden(res, "Super admin access required");
  }

  const { token } = req.body;
  if (!token) {
    return response.badRequest(res, "TOTP token is required");
  }

  const user = await authDAO.findUserById(req.user.id, req.tenant?.id);
  if (!user || !user.totpSecret) {
    return response.badRequest(res, "TOTP not set up");
  }

  const isValid = totpService.verifyTOTP(user.totpSecret, String(token).trim());
  if (!isValid) {
    return response.badRequest(res, "Invalid TOTP token");
  }

  await authDAO.updateUser(req.user.id, { totpEnabled: true, totpConfirmed: true });

  res.status(200).json({ success: true, message: "TOTP enabled successfully" });
};

const disableTOTPHandler = async (req, res) => {
  if (!req.user?.isSuperAdmin) {
    return response.forbidden(res, "Super admin access required");
  }

  await authDAO.updateUser(req.user.id, { totpEnabled: false, totpConfirmed: false, totpSecret: null, totpBackupCodes: null });

  res.status(200).json({ success: true, message: "TOTP disabled successfully" });
};

const totpStatusHandler = async (req, res) => {
  const user = await authDAO.findUserById(req.user.id, req.tenant?.id);
  res.status(200).json({
    success: true,
    enabled: !!user?.totpEnabled,
    confirmed: !!user?.totpConfirmed,
  });
};

const regenerateBackupCodesHandler = async (req, res) => {
  if (!req.user?.isSuperAdmin) {
    return response.forbidden(res, "Super admin access required");
  }

  const user = await authDAO.findUserById(req.user.id, req.tenant?.id);
  if (!user || !user.totpSecret) {
    return response.badRequest(res, "TOTP not set up");
  }

  const backupCodes = totpService.generateBackupCodes(10);
  const hashedCodes = totpService.hashBackupCodes(backupCodes);

  await authDAO.updateUser(req.user.id, { totpBackupCodes: JSON.stringify(hashedCodes) });

  res.status(200).json({ success: true, backupCodes });
};

const verifyBackupCodeHandler = async (req, res) => {
  if (!req.user?.isSuperAdmin) {
    return response.forbidden(res, "Super admin access required");
  }

  const { code } = req.body;
  if (!code) {
    return response.badRequest(res, "Backup code is required");
  }

  const user = await authDAO.findUserById(req.user.id, req.tenant?.id);
  if (!user || !user.totpBackupCodes) {
    return response.badRequest(res, "No backup codes available");
  }

  const hashedCodes = JSON.parse(user.totpBackupCodes);
  const isValid = totpService.verifyBackupCode(code, hashedCodes);

  if (!isValid) {
    return response.badRequest(res, "Invalid backup code");
  }

  await authDAO.updateUser(req.user.id, { totpBackupCodes: JSON.stringify(hashedCodes) });

  res.status(200).json({ success: true, message: "Backup code accepted" });
};

module.exports = {
  setupTOTPHandler,
  confirmTOTPHandler,
  disableTOTPHandler,
  totpStatusHandler,
  regenerateBackupCodesHandler,
  verifyBackupCodeHandler,
};
