const requireBreakGlass = (req, res, next) => {
  if (
    !req.user ||
    req.user.breakGlassApproved !== true ||
    !(req.user.breakGlassExpiresAt > new Date())
  ) {
    return res.status(403).json({
      success: false,
      message: "Break-glass elevation required to access debug endpoints.",
    });
  }
  next();
};

module.exports = { requireBreakGlass };
