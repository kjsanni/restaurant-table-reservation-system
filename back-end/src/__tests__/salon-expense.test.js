"use strict";

jest.mock("../verticals/salon/DAOs/expense.dao");
jest.mock("../middleware/auditLog", () => ({ logAction: jest.fn() }));

const expenseController = require("../verticals/salon/controllers/expense.controller");
const { makeRes } = require("./utils/test-response");

describe("expense.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getExpenses passes tenantId to DAO and returns data", async () => {
    require("../verticals/salon/DAOs/expense.dao").findAll.mockResolvedValue([
      { id: 1, category: "rent", amount: 1000 },
      { id: 2, category: "utilities", amount: 200 },
    ]);

    const ref = makeRes();
    const req = { tenant: { id: 1 }, query: {} };

    await expenseController.getExpensesHandler(req, ref.res);

    expect(require("../verticals/salon/DAOs/expense.dao").findAll).toHaveBeenCalledWith(1, {});
    ref.expectJson({
      success: true,
      data: [
        { id: 1, category: "rent", amount: 1000 },
        { id: 2, category: "utilities", amount: 200 },
      ],
    });
  });

  it("createExpense returns 201 and creates expense", async () => {
    require("../verticals/salon/DAOs/expense.dao").create.mockResolvedValue({
      id: 1,
      category: "rent",
      amount: 1000,
    });

    const ref = makeRes();
    const req = {
      tenant: { id: 1 },
      body: { category: "rent", amount: 1000, currency: "GHS", date: "2026-07-24" },
    };

    await expenseController.createExpenseHandler(req, ref.res);

    expect(ref.res.status).toHaveBeenCalledWith(201);
    ref.expectJson({
      success: true,
      data: { id: 1, category: "rent", amount: 1000 },
    });
  });

  it("getExpense returns 404 json when DAO returns null", async () => {
    require("../verticals/salon/DAOs/expense.dao").findById.mockResolvedValue(null);

    const ref = makeRes();
    const req = { tenant: { id: 1 }, params: { id: 999 } };

    await expenseController.getExpenseHandler(req, ref.res);

    expect(ref.res.status).toHaveBeenCalledWith(404);
    ref.expectJson({ success: false, message: "Expense not found" });
  });

  it("updateExpense returns 404 when DAO returns null", async () => {
    require("../verticals/salon/DAOs/expense.dao").update.mockResolvedValue(null);

    const ref = makeRes();
    const req = { tenant: { id: 1 }, params: { id: 999 }, body: { amount: 1500 } };

    await expenseController.updateExpenseHandler(req, ref.res);

    expect(ref.res.status).toHaveBeenCalledWith(404);
    ref.expectJson({ success: false, message: "Expense not found" });
  });

  it("deleteExpense returns 404 when DAO returns false", async () => {
    require("../verticals/salon/DAOs/expense.dao").delete.mockResolvedValue(false);

    const ref = makeRes();
    const req = { tenant: { id: 1 }, params: { id: 999 } };

    await expenseController.deleteExpenseHandler(req, ref.res);

    expect(ref.res.status).toHaveBeenCalledWith(404);
    ref.expectJson({ success: false, message: "Expense not found" });
  });
});
