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
  mergeTables(tableIds) {
    return API.post("/tables/merge", { tableIds });
  }
  unmergeTable(tableId) {
    return API.post("/tables/" + tableId + "/unmerge");
  }
  calculatePrice(capacity) {
    return API.post("/tables/price", { capacity });
  }
  updateTable(tableId, data) {
    return API.patch("/tables/" + tableId, data);
  }
  updatePosition(tableId, posX, posY) {
    return API.patch("/tables/" + tableId + "/position", { posX, posY });
  }
  deleteTable(tableId) {
    return API.delete("/tables/" + tableId + "/delete");
  }
  bulkUpdate(ids, payload) {
    return API.patch("/tables/bulk/update", { ids, ...payload });
  }
  bulkDelete(ids) {
    return API.delete("/tables/bulk/delete", { ids });
  }
  bulkAssign(ids, userId) {
    return API.post("/tables/bulk/assign", { ids, userId });
  }
  getEvents(tableId, limit) {
    return API.get("/tables/" + tableId + "/events" + (limit ? "?limit=" + limit : ""));
  }
}

export default new TableAPI();
