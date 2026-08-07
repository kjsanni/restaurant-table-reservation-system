"use strict";
const staffLocationAssignmentDao = require("../DAOs/staffLocationAssignment.dao");
const { createCrudHandlers } = require("./base.controller");

const staffLocationAssignmentHandlers = createCrudHandlers(
  staffLocationAssignmentDao,
  "StaffLocationAssignment",
  {
    displayName: "Staff location assignment",
  }
);

module.exports = {
  ...staffLocationAssignmentHandlers,
};
