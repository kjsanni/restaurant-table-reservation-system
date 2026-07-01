const db = require("../db/models");
const Table = db.table;
const Reservation = db.reservation;
const User = db.user;

const findAllTables = async () => {
  return await Table.findAll({
    include: [
      {
        model: Reservation,
      },
      {
        model: User,
        through: { attributes: [] },
        attributes: ["id", "username", "email", "role"],
      },
    ],
  });
};

const createTable = async ({ name, capacity, staffIds }) => {
  const table = await Table.create({
    name: name,
    capacity: capacity,
  });
  if (staffIds && staffIds.length > 0) {
    await table.addUsers(staffIds);
  }
  return table;
};

const findTableById = async (id) => {
  return await Table.findOne({
    where: {
      id: id,
    },
  });
};

const updateTable = async (table, payload) => {
  return await table.update(payload);
};

const blockTable = async (id, notes = null) => {
  const table = await findTableById(id);
  if (!table) {
    throw { status: 404, message: "Table not found!" };
  }
  return await table.update({ isBlocked: true, maintenanceNotes: notes });
};

const unblockTable = async (id) => {
  const table = await findTableById(id);
  if (!table) {
    throw { status: 404, message: "Table not found!" };
  }
  return await table.update({ isBlocked: false, maintenanceNotes: null });
};

const freeTable = async (reservationDAO, table) => {
  const reservationId = table.reservationId;
  if (!reservationId) {
    await updateTable(table, {
      isOccupied: false,
      reservationId: null,
    });
    return null;
  }

  const reservation = await reservationDAO.findReservationById(reservationId);
  await updateTable(table, {
    isOccupied: false,
    reservationId: null,
  });

  if (reservation) {
    return await reservation.update({ resStatus: "completed" });
  }
  return null;
};

const getWaitingStaff = async () => {
  const staff = await User.findAll({
    where: { role: "staff" },
    attributes: {
      include: [
        [
          db.sequelize.literal(`(
            SELECT COUNT(*) FROM table_staff WHERE table_staff.userId = user.id
          )`),
          "tableCount",
        ],
      ],
    },
    order: [["username", "ASC"]],
  });
  return staff.map((s) => ({
    id: s.id,
    username: s.username,
    email: s.email,
    tableCount: parseInt(s.dataValues.tableCount, 10) || 0,
  }));
};

const assignStaffToTable = async (tableId, userId) => {
  const table = await findTableById(tableId);
  if (!table) {
    throw { status: 404, message: "Table not found!" };
  }
  const user = await User.findByPk(userId);
  if (!user) {
    throw { status: 404, message: "User not found!" };
  }
  const existingStaff = await table.getUsers();
  const alreadyAssigned = existingStaff.some((s) => s.id === userId);
  if (alreadyAssigned) {
    throw { status: 400, message: "Staff already assigned to this table!" };
  }
  if (existingStaff.length >= 5) {
    throw { status: 400, message: "Table already has 5 staff assigned!" };
  }
  const userTables = await user.getTables();
  if (userTables.length >= 5) {
    throw { status: 400, message: "Staff member already assigned to 5 tables!" };
  }
  await table.addUser(user);
  return { tableId, userId };
};

const unassignStaffFromTable = async (tableId, userId) => {
  const table = await findTableById(tableId);
  if (!table) {
    throw { status: 404, message: "Table not found!" };
  }
  const user = await User.findByPk(userId);
  if (!user) {
    throw { status: 404, message: "User not found!" };
  }
  await table.removeUser(user);
  return { tableId, userId };
};

const getPriceForCapacity = (capacity) => {
  const basePrice = parseFloat(process.env.TABLE_BASE_PRICE || 20);
  const pricePerSeat = parseFloat(process.env.TABLE_PRICE_PER_ADDITIONAL_SEAT || 5);
  if (capacity <= 6) {
    return basePrice;
  }
  return basePrice + (capacity - 6) * pricePerSeat;
};

const mergeTables = async (tableIds) => {
  if (!tableIds || tableIds.length < 2) {
    throw { status: 400, message: "At least 2 tables required for merge!" };
  }

  const tables = await Table.findAll({
    where: { id: tableIds },
  });

  if (tables.length !== tableIds.length) {
    throw { status: 404, message: "One or more tables not found!" };
  }

  const hasBlocked = tables.some((t) => t.isBlocked);
  if (hasBlocked) {
    throw { status: 400, message: "Cannot merge blocked tables!" };
  }

  const hasOccupied = tables.some((t) => t.isOccupied);
  if (hasOccupied) {
    throw { status: 400, message: "Cannot merge occupied tables!" };
  }

  const hasParent = tables.some((t) => t.parentTableId);
  if (hasParent) {
    throw { status: 400, message: "Cannot merge tables that are already merged!" };
  }

  const mergedCapacity = tables.reduce((sum, t) => sum + (t.capacity || 0), 0);
  const mergedPrice = tables.reduce((sum, t) => sum + (parseFloat(t.price) || 0), 0);
  const primaryName = tables.map((t) => t.name).join(" + ");

  const parentTable = await Table.create({
    name: primaryName,
    capacity: mergedCapacity,
    price: mergedPrice,
    isBlocked: false,
    maintenanceNotes: `Merged from: ${tables.map((t) => t.name).join(", ")}`,
  });

  for (const table of tables) {
    await table.update({ parentTableId: parentTable.id });
  }

  return {
    parentTable,
    mergedTables: tables.map((t) => t.id),
  };
};

const unmergeTable = async (tableId) => {
  const mergedTables = await Table.findAll({
    where: { parentTableId: tableId },
  });

  if (mergedTables.length === 0) {
    throw { status: 400, message: "Table is not a merged table!" };
  }

  for (const table of mergedTables) {
    await table.update({ parentTableId: null });
  }

  const parentTable = await findTableById(tableId);
  await parentTable.destroy();

  return { unmergedTableIds: mergedTables.map((t) => t.id) };
};

module.exports = {
  findAllTables,
  createTable,
  findTableById,
  freeTable,
  blockTable,
  unblockTable,
  getWaitingStaff,
  assignStaffToTable,
  unassignStaffFromTable,
};
