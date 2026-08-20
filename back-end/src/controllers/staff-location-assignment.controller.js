"use strict";
const staffLocationAssignmentDao = require("../verticals/salon/DAOs/staffLocationAssignment.dao");
const { createCrudHandlers } = require("../verticals/salon/controllers/base.controller");

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
