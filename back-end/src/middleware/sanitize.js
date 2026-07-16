const sanitizeString = (value) => {
  if (typeof value !== "string") return value;
  // Remove only control characters (incl. null bytes) that output encoding
  // cannot neutralise. We deliberately do NOT strip `<>`, `on\w+=`, or URI
  // schemes here: that is denylist-based input mangling that corrupts
  // legitimate content (e.g. "2 < 3 guests") and gives a false sense of
  // safety. XSS defence is provided by output encoding (Vue auto-escapes
  // `{{ }}`, and the one v-html usage is sandboxed via iframe srcdoc).
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim();
};

const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== "object") return obj;
  const sanitized = {};
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (key === "password") {
      sanitized[key] = value;
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

const sanitize = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  next();
};

module.exports = { sanitize, sanitizeString, sanitizeObject };
