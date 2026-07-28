"use strict";
const { t, getLocale } = require("../locales");

function localizedResponse(req, res, status, key, values = {}) {
  const locale = getLocale(req);
  return res.status(status).json({
    success: true,
    message: t(key, locale, values),
  });
}

function localizedError(req, res, status, key, values = {}) {
  const locale = getLocale(req);
  return res.status(status).json({
    success: false,
    message: t(key, locale, values),
  });
}

module.exports = {
  localizedResponse,
  localizedError,
};
