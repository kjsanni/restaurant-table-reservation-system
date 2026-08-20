"use strict";
const { t, getLocale } = require("../locales");

function localizedResponse(req, res, status, key, values = {}, data = null) {
  const locale = getLocale(req);
  const payload = {
    success: true,
    message: t(key, locale, values),
  };
  if (data !== null) {
    payload.data = data;
  }
  return res.status(status).json(payload);
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
