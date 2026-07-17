const getAllTables = async (tableDAO, tenantId) => {
  return await tableDAO.findAllTables(tenantId);
};

const registerTable = async (tableDAO, { name, capacity, staffIds }, tenantId) => {
  return await tableDAO.createTable({ name, capacity, staffIds }, tenantId);
};

const editTable = async (tableDAO, id, { name, capacity }, tenantId) => {
  const table = await tableDAO.findTableById(id, tenantId);
  if (!table) {
    throw { status: 404, message: "Table not found!" };
  }
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (capacity !== undefined) updates.capacity = capacity;
  return await tableDAO.updateTable(table, updates, tenantId);
};

const freeTable = async ({ reservationDAO, tableDAO }, tableId, tenantId) => {
  const table = await tableDAO.findTableById(tableId, tenantId);
  if (!table)
    throw {
      status: 404,
      message: "Restaurant table not found!",
    };

  return await tableDAO.freeTable(reservationDAO, table, tenantId);
};

const getWaitingStaff = async (tableDAO, tenantId) => {
  return await tableDAO.getWaitingStaff(tenantId);
};

const assignStaff = async (tableDAO, tableId, userId, tenantId) => {
  return await tableDAO.assignStaffToTable(tableId, userId, tenantId);
};

const unassignStaff = async (tableDAO, tableId, userId, tenantId) => {
  return await tableDAO.unassignStaffFromTable(tableId, userId, tenantId);
};

const updateTablePosition = async (tableDAO, id, positionX, positionY, floorPlanId, tenantId) => {
  return await tableDAO.updateTablePosition(id, positionX, positionY, floorPlanId, tenantId);
};

const recordEvent = async (tableDAO, tableId, eventType, description = null, actorId = null, tenantId) => {
  return await tableDAO.recordEvent(tableId, eventType, description, actorId, tenantId);
};

module.exports = {
  getAllTables,
  registerTable,
  editTable,
  freeTable,
  getWaitingStaff,
  assignStaff,
  unassignStaff,
  updateTablePosition,
  recordEvent,
};
