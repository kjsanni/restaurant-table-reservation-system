const { recordLatency } = require("../utils/apiLatency");

const apiLatencyMiddleware = (req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const latencyMs = Date.now() - start;
    recordLatency(req, latencyMs);
  });
  next();
};

module.exports = apiLatencyMiddleware;
