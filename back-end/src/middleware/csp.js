const helmet = require("helmet");

const getCspDirectives = () => {
  const isDev = process.env.NODE_ENV !== "production";
  const frontendOrigin = process.env.FRONTEND_URL || "http://localhost:8080";
  const backendOrigin = process.env.API_URL || "http://localhost:8000";

  const directives = {
    defaultSrc: ["'self'"],
    scriptSrc: isDev
      ? ["'self'", "'unsafe-inline'", "'unsafe-eval'"]
      : ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:", "http:"],
    fontSrc: ["'self'", "data:"],
    connectSrc: ["'self", backendOrigin, frontendOrigin],
    frameAncestors: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    upgradeInsecureRequests: isDev ? [] : ["'self'"],
  };

  if (isDev) {
    directives.connectSrc.push("ws:", "http://localhost:*", "http://127.0.0.1:*");
  }

  return directives;
};

const cspHeaders = (req, res, next) => {
  const directives = getCspDirectives();
  const cspValue = Object.entries(directives)
    .flatMap(([key, values]) => {
      if (values.length === 0) return [];
      return [`${key} ${values.join(" ")}`];
    })
    .join("; ");

  res.setHeader("Content-Security-Policy", cspValue);
  next();
};

module.exports = { cspHeaders };
