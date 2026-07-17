const getCspDirectives = () => {
  const isDev = process.env.NODE_ENV !== "production";
  const corsOrigins = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  const defaultFrontend = isDev ? "http://localhost:8080" : "http://192.168.88.10";
  const defaultBackend = isDev ? "http://localhost:8000" : "http://192.168.88.10";

  const frontendOrigin = process.env.FRONTEND_URL || defaultFrontend;
  const backendOrigin = process.env.API_URL || defaultBackend;

  const connectSrc = isDev
    ? ["'self'", "ws:", "http://localhost:*", "http://127.0.0.1:*", backendOrigin, frontendOrigin, ...corsOrigins]
    : ["'self'", "ws:", backendOrigin, frontendOrigin, ...corsOrigins];

  const directives = {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'"],
    imgSrc: ["'self'", "data:", "https:"],
    fontSrc: ["'self'", "data:"],
    connectSrc: ["'self'", backendOrigin, frontendOrigin],
    frameAncestors: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    upgradeInsecureRequests: isDev ? [] : ["'self'"],
  };

  if (isDev) {
    directives.scriptSrc = ["'self'", "'unsafe-inline'"];
    directives.imgSrc.push("http:");
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
