const tableService = require("../services/tableService");
const tableDAO = require("../DAOs/table.dao");
const reservationDAO = require("../DAOs/reservation.dao");
const authDAO = require("../DAOs/auth.dao");

const getAllHandler = async (req, res) => {
  const tables = await tableService.getAllTables(tableDAO);

  if (tables.length === 0)
    throw {
      status: 404,
      message: "No restaurant tables inserted in the database.",
    };

  return res.status(200).json({
    success: true,
    collection: tables,
  });
};

const registerHandler = async (req, res) => {
  const { name, capacity, staffIds } = req.body;

  if (!name || !capacity)
    throw {
      status: 400,
      message: "Please fill in all fields!",
    };

  const table = await tableService.registerTable(tableDAO, {
    name,
    capacity,
    staffIds: staffIds || [],
  });

  return res.status(201).json({
    success: true,
    message: "Table successfully registered in the restaurant!",
    item: table,
  });
};

const freeTableHandler = async (req, res) => {
  const tableId = req.params.tableId;
  const info = await tableService.freeTable(
    { reservationDAO, tableDAO },
    tableId
  );

  const io = req.app.get("io");
  if (io) {
    io.emit("table-freed", { tableId, reservationId: info?.id });
  }

  return res.status(200).json({
    success: true,
    message: "Successfully freed the chosen table!",
    item: info,
  });
};

const blockTableHandler = async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;
  const table = await tableDAO.blockTable(id, notes);

  return res.status(200).json({
    success: true,
    message: "Table blocked for maintenance!",
    item: table,
  });
};

const unblockTableHandler = async (req, res) => {
  const { id } = req.params;
  const table = await tableDAO.unblockTable(id);

  return res.status(200).json({
    success: true,
    message: "Table unblocked!",
    item: table,
  });
};

const getWaitingStaffHandler = async (req, res) => {
  const staff = await tableService.getWaitingStaff(tableDAO);
  return res.status(200).json({
    success: true,
    staff,
  });
};

const assignStaffHandler = async (req, res) => {
  const { tableId } = req.params;
  const { userId } = req.body;
  const info = await tableService.assignStaff(tableDAO, tableId, userId);

  return res.status(200).json({
    success: true,
    message: "Staff assigned successfully!",
    item: info,
  });
};

const unassignStaffHandler = async (req, res) => {
  const { tableId, userId } = req.params;
  const info = await tableService.unassignStaff(tableDAO, tableId, userId);

  return res.status(200).json({
    success: true,
    message: "Staff unassigned successfully!",
    item: info,
  });
};

const mergeTablesHandler = async (req, res) => {
  const { tableIds } = req.body;
  const result = await tableService.mergeTables(tableDAO, tableIds);

  return res.status(200).json({
    success: true,
    message: "Tables merged successfully!",
    item: result,
  });
};

const unmergeTableHandler = async (req, res) => {
  const { tableId } = req.params;
  const result = await tableService.unmergeTable(tableDAO, tableId);

  return res.status(200).json({
    success: true,
    message: "Table unmerged successfully!",
    item: result,
  });
};

const calculatePriceHandler = async (req, res) => {
  const { capacity } = req.body;
  const settings = await authDAO.getAllSettings();
  const settingsMap = settings.reduce((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {});
  const price = tableService.getPriceForCapacity(capacity, settingsMap);

  return res.status(200).json({
    success: true,
    price,
  });
};

const updatePositionHandler = async (req, res) => {
  const { id } = req.params;
  const { posX, posY } = req.body;
  const table = await tableService.updatePosition(tableDAO, id, posX, posY);

  return res.status(200).json({
    success: true,
    message: "Table position updated!",
    item: table,
  });
};

const deleteHandler = async (req, res) => {
  const { id } = req.params;
  const result = await tableService.delete(tableDAO, id);
  return res.status(200).json({
    success: true,
    message: "Table deleted!",
    item: result,
  });
};

const bulkUpdateHandler = async (req, res) => {
  const { ids, isBlocked, maintenanceNotes } = req.body;
  const payload = {};
  if (typeof isBlocked === "boolean") payload.isBlocked = isBlocked;
  if (maintenanceNotes !== undefined) payload.maintenanceNotes = maintenanceNotes;
  const result = await tableService.bulkUpdate(tableDAO, ids, payload);
  return res.status(200).json({
    success: true,
    message: `Updated ${result.count} tables`,
    count: result.count,
  });
};

const bulkDeleteHandler = async (req, res) => {
  const { ids } = req.body;
  const result = await tableService.bulkDelete(tableDAO, ids);
  return res.status(200).json({
    success: true,
    message: `Deleted ${result.count} tables`,
    count: result.count,
  });
};

const bulkAssignHandler = async (req, res) => {
  const { ids, userId } = req.body;
  const result = await tableService.bulkAssignStaff(tableDAO, ids, userId);
  return res.status(200).json({
    success: true,
    message: `Assigned staff to ${result.count} tables`,
    count: result.count,
  });
};

module.exports = {
  getAllHandler,
  registerHandler,
  freeTableHandler,
  blockTableHandler,
  unblockTableHandler,
  getWaitingStaffHandler,
  assignStaffHandler,
  unassignStaffHandler,
  mergeTablesHandler,
  unmergeTableHandler,
  calculatePriceHandler,
  updatePositionHandler,
  deleteHandler,
  bulkUpdateHandler,
  bulkDeleteHandler,
  bulkAssignHandler,
};
