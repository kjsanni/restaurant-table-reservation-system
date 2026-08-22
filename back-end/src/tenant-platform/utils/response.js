"use strict";

const response = {};

response.ok = (res, payload = {}) => {
  return res.status(200).json({ success: true, ...payload });
};

response.created = (res, payload = {}) => {
  return res.status(201).json({ success: true, ...payload });
};

response.badRequest = (res, message) => {
  return res.status(400).json({ success: false, message });
};

response.notFound = (res, message) => {
  return res.status(404).json({ success: false, message });
};

response.forbidden = (res, message) => {
  return res.status(403).json({ success: false, message });
};

response.conflict = (res, message) => {
  return res.status(409).json({ success: false, message });
};

response.error = (res, status, message) => {
  return res.status(status).json({ success: false, message });
};

module.exports = response;
