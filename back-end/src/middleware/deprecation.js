"use strict";

const deprecationHeaders = (options = {}) => {
  const { sunsetDate, deprecationDate, link, description } = options;

  return (req, res, next) => {
    if (sunsetDate) {
      res.setHeader("Sunset", sunsetDate);
    }
    if (deprecationDate) {
      res.setHeader("Deprecation", deprecationDate);
    }
    if (link) {
      res.setHeader("Link", `<${link}>; rel="deprecation"`);
    }
    if (description) {
      res.setHeader("Deprecation-Description", description);
    }
    next();
  };
};

const versioningHeaders = (req, res, next) => {
  res.setHeader("API-Version", "1.0.0");
  next();
};

module.exports = {
  deprecationHeaders,
  versioningHeaders,
};
