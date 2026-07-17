const getAllTables = async (tableDAO) => {
  return await tableDAO.findAllTables();
};

const registerTable = async (tableDAO, { name, capacity, staffIds }) => {
  return await tableDAO.createTable({ name, capacity, staffIds });
};

const editTable = async (tableDAO, id, { name, capacity }) => {
  const table = await tableDAO.findTableById(id);
  if (!table) {
    throw { status: 404, message: "Table not found!" };
  }
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (capacity !== undefined) updates.capacity = capacity;
  return await tableDAO.updateTable(table, updates);
};

const freeTable = async ({ reservationDAO, tableDAO }, tableId) => {
  const table = await tableDAO.findTableById(tableId);
  if (!table)
    throw {
      status: 404,
      message: "Restaurant table not found!",
    };

  return await tableDAO.freeTable(reservationDAO, table);
};

const getWaitingStaff = async (tableDAO) => {
  return await tableDAO.getWaitingStaff();
};

const assignStaff = async (tableDAO, tableId, userId) => {
  return await tableDAO.assignStaffToTable(tableId, userId);
};

const unassignStaff = async (tableDAO, tableId, userId) => {
  return await tableDAO.unassignStaffFromTable(tableId, userId);
};

const updateTablePosition = async (tableDAO, id, positionX, positionY, floorPlanId) => {
  return await tableDAO.updateTablePosition(id, positionX, positionY, floorPlanId);
};

const recordEvent = async (tableDAO, tableId, eventType, description = null, actorId = null) => {
  return await tableDAO.recordEvent(tableId, eventType, description, actorId);
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
