"use strict";

const { protect, requireSuperAdmin } = require("./auth");
const ipAllowlist = require("./ipAllowlist");

const adminMiddleware = (req, res, next) => {
  ipAllowlist(req, res, () => {
    protect(req, res, () => {
      requireSuperAdmin(req, res, next);
    });
  });
};

module.exports = { adminMiddleware };
