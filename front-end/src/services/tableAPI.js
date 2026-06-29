import API from "./API";

class TableAPI {
  registerTable(tableData) {
    return API.post("/tables", tableData);
  }
  getTables() {
    return API.get("/tables");
  }
  freeTable(tableId) {
    return API.delete("/tables/" + tableId);
  }
  blockTable(tableId, notes) {
    return API.patch("/tables/" + tableId + "/block", { notes });
  }
  unblockTable(tableId) {
    return API.patch("/tables/" + tableId + "/unblock");
  }
  getWaitingStaff() {
    return API.get("/tables/staff");
  }
  assignStaff(tableId, userId) {
    return API.post("/tables/" + tableId + "/staff", { userId });
  }
  unassignStaff(tableId, userId) {
    return API.delete("/tables/" + tableId + "/staff/" + userId);
  }
}

export default new TableAPI();
