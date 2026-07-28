import API from "./API";

class CommissionAPI {
  getCommissions(params = {}) {
    return API.get("/salon/commissions", { params });
  }

  getCommission(id) {
    return API.get("/salon/commissions/" + id);
  }

  createCommission(data) {
    return API.post("/salon/commissions", data);
  }

  updateCommission(id, data) {
    return API.patch("/salon/commissions/" + id, data);
  }

  deleteCommission(id) {
    return API.delete("/salon/commissions/" + id);
  }

  markCommissionPaid(id) {
    return API.post("/salon/commissions/" + id + "/mark-paid");
  }

  getPendingTotal(params = {}) {
    return API.get("/salon/commissions/pending-total", { params });
  }
}

export default new CommissionAPI();
