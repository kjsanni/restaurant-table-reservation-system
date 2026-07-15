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

const getPriceForCapacity = (capacity) => {
  const basePrice = parseFloat(process.env.TABLE_BASE_PRICE || 20);
  const pricePerSeat = parseFloat(process.env.TABLE_PRICE_PER_ADDITIONAL_SEAT || 5);
  if (capacity <= 6) {
    return basePrice;
  }
  return basePrice + (capacity - 6) * pricePerSeat;
};

const mergeTables = async (tableDAO, tableIds) => {
  return await tableDAO.mergeTables(tableIds);
};

const unmergeTable = async (tableDAO, tableId) => {
  return await tableDAO.unmergeTable(tableId);
};

const updatePosition = async (tableDAO, tableId, posX, posY) => {
  return await tableDAO.updateTablePosition(tableId, posX, posY);
};

module.exports = {
  getAllTables,
  registerTable,
  freeTable,
  getWaitingStaff,
  assignStaff,
  unassignStaff,
  getPriceForCapacity,
  mergeTables,
  unmergeTable,
  updatePosition,
};
