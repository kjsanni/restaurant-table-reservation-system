const getAllTables = async (tableDAO) => {
  return await tableDAO.findAllTables();
};

const registerTable = async (tableDAO, { name, capacity, staffIds }) => {
  return await tableDAO.createTable({ name, capacity, staffIds });
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

module.exports = {
  getAllTables,
  registerTable,
  freeTable,
  getWaitingStaff,
  assignStaff,
  unassignStaff,
};
