const sanitizeString = (value) => {
  if (typeof value !== "string") return value;
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim();
};

const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== "object") return obj;
  const sanitized = {};
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (key === "password") {
      sanitized[key] = "[REDACTED]";
      continue;
    }
    if (key === "token" || key === "refreshToken" || key === "accessToken") {
      sanitized[key] = "[REDACTED]";
      continue;
    }
    if (key === "secret" || key === "apiKey" || key === "api_secret") {
      sanitized[key] = "[REDACTED]";
      continue;
    }
    if (key === "authorization" || key === "x-paystack-signature") {
      sanitized[key] = "[REDACTED]";
      continue;
    }
    if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === "string" ? sanitizeString(item) : sanitizeObject(item)
      );
    } else if (value && typeof value === "object") {
      sanitized[key] = sanitizeObject(value);
    } else if (typeof value === "string") {
      sanitized[key] = sanitizeString(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

const sanitizeLogArgs = (args) => {
  return args.map((arg) => {
    if (typeof arg === "string") {
      return sanitizeString(arg);
    }
    if (arg && typeof arg === "object") {
      return sanitizeObject(arg);
    }
    return arg;
  });
};

const createSanitizedLogger = (method) => {
  return (...args) => {
    console[method](...sanitizeLogArgs(args));
  };
};

const logger = {
  log: createSanitizedLogger("log"),
  warn: createSanitizedLogger("warn"),
  error: createSanitizedLogger("error"),
  info: createSanitizedLogger("info"),
  debug: createSanitizedLogger("debug"),
};

module.exports = logger;
module.exports.sanitizeObject = sanitizeObject;
module.exports.sanitizeString = sanitizeString;
module.exports.sanitizeLogArgs = sanitizeLogArgs;
