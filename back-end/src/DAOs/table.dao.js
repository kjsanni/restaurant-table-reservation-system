const db = require("../db/models");
const Table = db.table;
const Reservation = db.reservation;
const Customer = db.customer;
const User = db.user;
const TableEvent = db.tableEvent;
const { fn, col } = db.sequelize;

const findAllTables = async () => {
  return await Table.findAll({
    attributes: { exclude: ["linkedTableIds"] },
    include: [
      {
        model: Reservation,
        include: [
          {
            model: Customer,
            attributes: [
              [fn("CONCAT", col("reservation->customer.firstName"), " ", col("reservation->customer.lastName")), "name"],
            ],
          },
        ],
      },
      {
        model: User,
        through: { attributes: [] },
        attributes: ["id", "username", "email", "role"],
      },
    ],
    order: [["positionY", "ASC"], ["positionX", "ASC"]],
  });
};

const createTable = async ({ name, capacity, staffIds, floorPlanId }) => {
  const table = await Table.create({
    name: name,
    capacity: capacity,
    floorPlanId: floorPlanId ?? null,
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
      linkedTableIds: null,
    });
    return null;
  }

  const linkedIds = Array.isArray(table.linkedTableIds)
    ? table.linkedTableIds
    : [];
  if (linkedIds.length > 0) {
    await Table.update(
      {
        isOccupied: false,
        reservationId: null,
        linkedTableIds: null,
      },
      {
        where: {
          id: linkedIds,
        },
      }
    );
  }

  const reservation = await reservationDAO.findReservationById(reservationId);
  await updateTable(table, {
    isOccupied: false,
    reservationId: null,
    linkedTableIds: null,
  });

  if (reservation) {
    const now = new Date();
    const resDateTime = new Date(`${reservation.resDate}T${reservation.resTime || "00:00:00"}`);
    const nextStatus = resDateTime > now ? "pending" : "completed";
    return await reservation.update({ resStatus: nextStatus });
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

const updateTablePosition = async (id, positionX, positionY, floorPlanId = "default") => {
  const table = await findTableById(id);
  if (!table) {
    throw { status: 404, message: "Table not found!" };
  }
  return await table.update({
    positionX,
    positionY,
    floorPlanId,
  });
};

const recordEvent = async (tableId, eventType, description = null, actorId = null) => {
  const table = await findTableById(tableId);
  if (!table) {
    throw { status: 404, message: "Table not found!" };
  }
  return await TableEvent.create({
    tableId: table.id,
    eventType,
    description,
    actorId,
  });
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
  updateTablePosition,
  recordEvent,
};
