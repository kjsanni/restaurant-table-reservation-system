const tableService = require("../services/tableService");
const tableDAO = require("../DAOs/table.dao");
const reservationDAO = require("../DAOs/reservation.dao");
const waitlistDAO = require("../DAOs/waitlist.dao");
const authDAO = require("../DAOs/auth.dao");

const BASE_SEATS = 6;

const calculatePriceHandler = async (req, res) => {
  const capacity = parseInt(req.body.capacity, 10);
  if (!capacity || capacity < 1) {
    return res.status(400).json({ success: false, message: "Invalid capacity" });
  }

  const basePrice = await authDAO.getSettingValue("table_base_price", 20, req.tenant?.id);
  const perAdditionalSeat = await authDAO.getSettingValue(
    "table_price_per_additional_seat",
    5,
    req.tenant?.id
  );

  const additionalSeats = Math.max(0, capacity - BASE_SEATS);
  const price = Number(basePrice) + additionalSeats * Number(perAdditionalSeat);

  return res.status(200).json({ success: true, price });
};

const getAllHandler = async (req, res) => {
  const tables = await tableService.getAllTables(tableDAO, req.tenant?.id);

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
  }, req.tenant?.id);

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
    tableId,
    req.tenant?.id
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
  const table = await tableDAO.blockTable(id, notes, req.tenant?.id);
  await tableService.recordEvent(tableDAO, id, "blocked", notes || null, req.user?.id || null, req.tenant?.id);

  const io = req.app.get("io");
  if (io) {
    io.emit("table-status-changed", { tableId: id, status: "blocked" });
  }

  return res.status(200).json({
    success: true,
    message: "Table blocked for maintenance!",
    item: table,
  });
};

const unblockTableHandler = async (req, res) => {
  const { id } = req.params;
  const table = await tableDAO.unblockTable(id, req.tenant?.id);
  await tableService.recordEvent(tableDAO, id, "unblocked", null, req.user?.id || null, req.tenant?.id);

  const io = req.app.get("io");
  if (io) {
    io.emit("table-status-changed", { tableId: id, status: "unblocked" });
  }

  return res.status(200).json({
    success: true,
    message: "Table unblocked!",
    item: table,
  });
};

const getWaitingStaffHandler = async (req, res) => {
  const staff = await tableService.getWaitingStaff(tableDAO, req.tenant?.id);
  return res.status(200).json({
    success: true,
    staff,
  });
};

const assignStaffHandler = async (req, res) => {
  const { tableId } = req.params;
  const { userId } = req.body;
  const info = await tableService.assignStaff(tableDAO, tableId, userId, req.tenant?.id);
  await tableService.recordEvent(tableDAO, tableId, "staff_assigned", null, req.user?.id || null, req.tenant?.id);

  const io = req.app.get("io");
  if (io) {
    io.emit("table-status-changed", { tableId, status: "staff_assigned" });
  }

  return res.status(200).json({
    success: true,
    message: "Staff assigned successfully!",
    item: info,
  });
};

const unassignStaffHandler = async (req, res) => {
  const { tableId, userId } = req.params;
  const info = await tableService.unassignStaff(tableDAO, tableId, userId, req.tenant?.id);
  await tableService.recordEvent(tableDAO, tableId, "staff_unassigned", null, req.user?.id || null, req.tenant?.id);

  const io = req.app.get("io");
  if (io) {
    io.emit("table-status-changed", { tableId, status: "staff_unassigned" });
  }

  return res.status(200).json({
    success: true,
    message: "Staff unassigned successfully!",
    item: info,
  });
};

const editHandler = async (req, res) => {
  const { id } = req.params;
  const { name, capacity } = req.body;
  const table = await tableService.editTable(tableDAO, id, { name, capacity }, req.tenant?.id);

  return res.status(200).json({
    success: true,
    message: "Table updated successfully!",
    item: table,
  });
};

const updatePositionHandler = async (req, res) => {
  const { id } = req.params;
  const { positionX, positionY, floorPlanId, posX, posY } = req.body;
  const x = positionX != null ? positionX : posX;
  const y = positionY != null ? positionY : posY;
  const table = await tableService.updateTablePosition(
    tableDAO,
    id,
    x,
    y,
    floorPlanId,
    req.tenant?.id
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
  calculatePriceHandler,
};
