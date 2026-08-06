"use strict";
const locationDao = require("../DAOs/location.dao");
const { createCrudHandlers } = require("./base.controller");

const locationHandlers = createCrudHandlers(locationDao, "Location", {
  displayName: "Location",
  passQueryToFindAll: false,
});

module.exports = {
  ...locationHandlers,
};
