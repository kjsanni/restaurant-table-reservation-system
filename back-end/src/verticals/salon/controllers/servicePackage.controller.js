"use strict";
const servicePackageDao = require("../DAOs/servicePackage.dao");
const { createCrudHandlers } = require("./base.controller");

const servicePackageHandlers = createCrudHandlers(servicePackageDao, "ServicePackage", {
  displayName: "Package",
});

module.exports = {
  ...servicePackageHandlers,
};
