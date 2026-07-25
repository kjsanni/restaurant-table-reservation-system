"use strict";

const expenseDao = require("../DAOs/expense.dao");

const createExpenseHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const data = req.body;
    const expense = await expenseDao.create(data, tenantId);
    return res.status(201).json({ success: true, data: expense });
  } catch (err) {
    console.error("createExpenseHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to create expense" });
  }
};

const getExpensesHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { category, startDate, endDate } = req.query;
    const expenses = await expenseDao.findAll(tenantId, { category, startDate, endDate });
    return res.status(200).json({ success: true, data: expenses });
  } catch (err) {
    console.error("getExpensesHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to load expenses" });
  }
};

const getExpenseHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { id } = req.params;
    const expense = await expenseDao.findById(id, tenantId);
    if (!expense) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }
    return res.status(200).json({ success: true, data: expense });
  } catch (err) {
    console.error("getExpenseHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to load expense" });
  }
};

const updateExpenseHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { id } = req.params;
    const updated = await expenseDao.update(id, tenantId, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error("updateExpenseHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to update expense" });
  }
};

const deleteExpenseHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { id } = req.params;
    const removed = await expenseDao.delete(id, tenantId);
    if (!removed) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("deleteExpenseHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to delete expense" });
  }
};

module.exports = {
  createExpenseHandler,
  getExpensesHandler,
  getExpenseHandler,
  updateExpenseHandler,
  deleteExpenseHandler,
};
