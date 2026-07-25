const allowedIPs = (process.env.ADMIN_ALLOWED_IPS || "")
  .split(",")
  .map((ip) => ip.trim())
  .filter(Boolean);

const ipAllowlist = (req, res, next) => {
  if (allowedIPs.length === 0) {
    return next();
  }

  const clientIP = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || "";
  const forwarded = req.headers["x-forwarded-for"];
  const realIP = Array.isArray(forwarded) ? forwarded[0] : forwarded || clientIP;

  if (!allowedIPs.includes(realIP)) {
    return res.status(403).json({
      success: false,
      message: "Access denied from this IP address",
    });
  }

  next();
};

module.exports = ipAllowlist;
