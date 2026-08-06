"use strict";
const referralDao = require("../DAOs/referral.dao");
const { createCrudHandlers } = require("./base.controller");

const referralHandlers = createCrudHandlers(referralDao, "Referral", {
  displayName: "Referral",
});

module.exports = {
  ...referralHandlers,
};
