const getErrorMessagesByColumn = require("../utils/getErrorMessages");

const isClientError = (status) => status >= 400 && status < 500;

const errorHandler = (err, req, res, next) => {
  if (err.name === "SequelizeValidationError") {
    return res.status(400).json({
      success: false,
      errors: getErrorMessagesByColumn(err.errors),
    });
  }

  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(409).json({
      success: false,
      message: "A record with this value already exists.",
      errors: getErrorMessagesByColumn(err.errors),
    });
  }

  if (err.name === "SequelizeForeignKeyConstraintError") {
    return res.status(400).json({
      success: false,
      message: "Referenced record not found.",
    });
  }

  const status = err?.status || 500;
  // Never leak internal error details (SQL, stack) on server errors.
  // Log the full error server-side; return a safe message to the client.
  if (!isClientError(status)) {
    console.error("Unhandled server error:", {
      method: req.method,
      path: req.originalUrl,
      message: err?.message,
      stack: err?.stack,
    });
    return res.status(status).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }

  return res.status(status).json({
    success: false,
    message: err?.message || "Something went wrong. Please try again later.",
  });
};

module.exports = errorHandler;
