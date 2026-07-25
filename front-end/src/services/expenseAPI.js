import API from "./API";

class ExpenseAPI {
  getExpenses(params = {}) {
    return API.get("/salon/expenses", { params });
  }
  getExpense(id) {
    return API.get(`/salon/expenses/${id}`);
  }
  createExpense(payload) {
    return API.post("/salon/expenses", payload);
  }
  updateExpense(id, payload) {
    return API.patch(`/salon/expenses/${id}`, payload);
  }
  deleteExpense(id) {
    return API.delete(`/salon/expenses/${id}`);
  }
}

export default new ExpenseAPI();
