const breakGlassRequestDAO = require("../tenant-platform/DAOs/breakGlassRequest.dao");

const requireElevatedSuperAdmin = (req, res, next) => {
  if (!req.user || !req.user.isSuperAdmin) {
    return res.status(403).json({
      success: false,
      message: "Super admin access required!",
    });
  }

  const elevatedUntil = req.user.elevatedUntil ? new Date(req.user.elevatedUntil) : null;
  const now = new Date();

  if (!elevatedUntil || elevatedUntil <= now) {
    return res.status(403).json({
      success: false,
      message: "Active break-glass elevation required. Request elevation first.",
      code: "requires_break_glass",
    });
  }

  next();
};

const refreshElevation = async (req, res, next) => {
  if (req.user && req.user.isSuperAdmin) {
    try {
      const activeRequest = await breakGlassRequestDAO.listForUser(req.user.id, {
        status: "approved",
        limit: 1,
      });

      if (activeRequest.length > 0 && activeRequest[0].elevatedUntil) {
        req.user.elevatedUntil = activeRequest[0].elevatedUntil;
      }
    } catch (err) {
      console.error("Failed to refresh elevation:", err.message);
    }
  }

  next();
};

module.exports = {
  requireElevatedSuperAdmin,
  refreshElevation,
};
