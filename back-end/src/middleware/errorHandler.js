const getErrorMessagesByColumn = require("../utils/getErrorMessages");
const { t, getLocale } = require("../locales");

const isClientError = (status) => status >= 400 && status < 500;

const errorHandler = (err, req, res, next) => {
  const locale = getLocale(req);

  if (err.name === "SequelizeValidationError") {
    const errors = getErrorMessagesByColumn(err.errors);
    const translatedErrors = {};
    for (const [field, messages] of Object.entries(errors)) {
      translatedErrors[field] = messages.map((msg) => t(msg, locale));
    }
    return res.status(400).json({
      success: false,
      errors: translatedErrors,
    });
  }

  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(409).json({
      success: false,
      message: t("common.recordExists", locale),
      errors: getErrorMessagesByColumn(err.errors),
    });
  }

  if (err.name === "SequelizeForeignKeyConstraintError") {
    return res.status(400).json({
      success: false,
      message: t("common.referencedRecordNotFound", locale),
    });
  }

  const status = err?.status || 500;
  if (!isClientError(status)) {
    console.error("Unhandled server error:", {
      method: req.method,
      path: req.originalUrl,
      message: err?.message,
      stack: err?.stack,
    });
    const response = {
      success: false,
      message: t("common.internalError", locale),
    };
    if (process.env.NODE_ENV !== "production") {
      response.debug = err?.message;
      response.stack = err?.stack;
    }
    return res.status(status).json(response);
  }

  return res.status(status).json({
    success: false,
    message: t(err?.message, locale) || err?.message || t("common.internalError", locale),
  });
};

module.exports = errorHandler;
