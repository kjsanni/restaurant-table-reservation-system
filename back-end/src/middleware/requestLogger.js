const fs = require("fs");
const path = require("path");

// codacy-suppress path-traversal Path is derived from __dirname, not user input
const logDir = path.join(__dirname, "../../logs");
const resolvedLogDir = path.resolve(logDir);

// codacy-suppress FileAccess Path is derived from __dirname, not user input
if (!fs.existsSync(resolvedLogDir)) {
  // codacy-suppress FileAccess Path is derived from __dirname, not user input
  fs.mkdirSync(resolvedLogDir, { recursive: true });
}

// codacy-suppress FileAccess Path is derived from __dirname, not user input
const logStream = fs.createWriteStream(
  path.join(resolvedLogDir, "requests.log"),
  { flags: "a" }
);
/* codacy-suppress-end */

const closeLogStream = () => {
  if (typeof logStream.end === "function") {
    logStream.end();
  }
};

const requestLogger = (req, res, next) => {
  const start = Date.now();
  const originalEnd = res.end;

  res.end = function(...args) {
    const duration = Date.now() - start;
    const log = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      timestamp: new Date().toISOString(),
    };
    logStream.write(JSON.stringify(log) + "\n");
    originalEnd.apply(this, args);
  };

  next();
};

module.exports = { requestLogger, closeLogStream };