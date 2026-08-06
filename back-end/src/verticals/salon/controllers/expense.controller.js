"use strict";
const expenseDao = require("../DAOs/expense.dao");
const { createCrudHandlers } = require("./base.controller");

const expenseHandlers = createCrudHandlers(expenseDao, "Expense", {
  displayName: "Expense",
});

module.exports = {
  ...expenseHandlers,
};
