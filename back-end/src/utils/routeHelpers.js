const tryCatchHandler = require("../middleware/tryCatch");
const { protect, requirePermission } = require("../middleware/auth");
const { validateCsrfToken } = require("../middleware/csrf");
const { requireActiveTenant } = require("../tenant-platform/middleware/tenantStatus");

const protectedRoute = (permission, handler) => {
  const middlewares = [tryCatchHandler(protect), tryCatchHandler(requireActiveTenant)];
  if (permission) {
    middlewares.push(tryCatchHandler(requirePermission(permission)));
  }
  middlewares.push(tryCatchHandler(handler));
  return middlewares;
};

const writeRoute = (permission, handler) => {
  const middlewares = protectedRoute(permission, handler);
  middlewares.splice(middlewares.length - 1, 0, validateCsrfToken);
  return middlewares;
};

module.exports = {
  protectedRoute,
  writeRoute,
};
