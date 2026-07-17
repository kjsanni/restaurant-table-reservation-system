const tableService = require("../services/tableService");
const tableDAO = require("../DAOs/table.dao");
const reservationDAO = require("../DAOs/reservation.dao");
const waitlistDAO = require("../DAOs/waitlist.dao");

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

    const suggestion = await waitlistDAO.getBestMatch(tableId);
    if (suggestion) {
      io.emit("waitlist-offer", {
        tableId,
        waitlistEntry: suggestion,
        offerExpiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      });
    }
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
  await tableService.recordEvent(tableDAO, id, "blocked", notes || null, req.user?.id || null);

  return res.status(200).json({
    success: true,
    message: "Table blocked for maintenance!",
    item: table,
  });
};

const unblockTableHandler = async (req, res) => {
  const { id } = req.params;
  const table = await tableDAO.unblockTable(id);
  await tableService.recordEvent(tableDAO, id, "unblocked", null, req.user?.id || null);

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
  await tableService.recordEvent(tableDAO, tableId, "staff_assigned", null, req.user?.id || null);

  return res.status(200).json({
    success: true,
    message: "Staff assigned successfully!",
    item: info,
  });
};

const unassignStaffHandler = async (req, res) => {
  const { tableId, userId } = req.params;
  const info = await tableService.unassignStaff(tableDAO, tableId, userId);
  await tableService.recordEvent(tableDAO, tableId, "staff_unassigned", null, req.user?.id || null);

  return res.status(200).json({
    success: true,
    message: "Staff unassigned successfully!",
    item: info,
  });
};

const editHandler = async (req, res) => {
  const { id } = req.params;
  const { name, capacity } = req.body;
  const table = await tableService.editTable(tableDAO, id, { name, capacity });

  return res.status(200).json({
    success: true,
    message: "Table updated successfully!",
    item: table,
  });
};

const updatePositionHandler = async (req, res) => {
  const { id } = req.params;
  const { positionX, positionY, floorPlanId } = req.body;
  const table = await tableService.updateTablePosition(
    tableDAO,
    id,
    positionX,
    positionY,
    floorPlanId
  );

  return res.status(200).json({
    success: true,
    message: "Table position updated!",
    item: table,
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
  editHandler,
  updatePositionHandler,
};
