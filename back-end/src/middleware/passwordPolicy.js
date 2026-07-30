const authDAO = require("../DAOs/auth.dao");
const { normalizeSettingValue } = require("../utils/settings");

const enforcePasswordPolicy = async (req, res, next) => {
  const password = req.body?.password;
  if (!password) {
    return res.status(400).json({ success: false, message: "Password is required" });
  }

  let policy = {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecialChar: true,
  };

  try {
    const setting = await authDAO.getSettingByKey("password_policy", req.tenant?.id);
    if (setting && setting.value) {
      const v = normalizeSettingValue(setting.value);
      policy = { ...policy, ...v };
    }
  } catch {
    // use defaults
  }

  const errors = [];
  if (password.length < (policy.minLength || 12)) {
    errors.push(`Password must be at least ${policy.minLength || 12} characters long`);
  }
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (policy.requireNumber && !/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  if (policy.requireSpecialChar && !/[^a-zA-Z0-9]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors.join(". ") + ".",
      errors,
    });
  }

  next();
};

module.exports = enforcePasswordPolicy;
