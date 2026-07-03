const db = require("../db/models");
const { fn, col } = db.sequelize;
const { Op } = db.Sequelize;
const Reservation = db.reservation;
const Customer = db.customer;
const Table = db.table;
const { flattenArrayObjects } = require("../utils/flattenObject");

const findAllReservations = async ({ limit, offset } = {}) => {
  const opts = {
    attributes: ["id", "customerId", "resDate", "resTime", "resStatus", "people", "paymentStatus", "expectedTotal", "notes"],
    include: [
      {
        model: Customer,
        attributes: [
          [fn("CONCAT", col("firstName"), " ", col("lastName")), "name"],
          "email",
          "phone",
          "visitCount",
          "lastVisitDate",
          "tags",
        ],
      },
      {
        model: Table,
        attributes: ["id", "name", "capacity"],
        required: false,
      },
    ],
  };
  if (limit) opts.limit = limit;
  if (offset !== undefined) opts.offset = offset;
  const { rows, count } = await Reservation.findAndCountAll(opts);
  const reservations = flattenArrayObjects(rows);
  if (limit) {
    return { reservations, total: count };
  }
  return reservations;
};

const searchReservations = async (filters = {}, { limit, offset } = {}) => {
  const { q, from, to, status } = filters;
  const where = {};

  if (status) {
    where.resStatus = status;
  }

  if (from) where.resDate = { ...where.resDate, [Op.gte]: from };
  if (to) where.resDate = { ...where.resDate, [Op.lte]: to };

  const include = [
    {
      model: Customer,
      attributes: [
        [fn("CONCAT", col("firstName"), " ", col("lastName")), "name"],
        "email",
        "phone",
        "visitCount",
        "lastVisitDate",
        "tags",
      ],
    },
  ];

  if (q) {
    const like = { [Op.like]: `%${q}%` };
    where[Op.or] = [
      { "$Customer.name$": like },
      { "$Customer.email$": like },
      { "$Customer.phone$": like },
      { resDate: like },
      { resTime: like },
      { notes: { [Op.like]: `%${q}%` } },
    ];
  }

  const baseOpts = {
    where,
    include,
    order: [["resDate", "ASC"], ["resTime", "ASC"]],
  };

  if (limit) baseOpts.limit = limit;
  if (offset !== undefined) baseOpts.offset = offset;

  const { rows, count } = await Reservation.findAndCountAll(baseOpts);
  let reservations = flattenArrayObjects(rows);

  if (q) {
    const term = q.toLowerCase();
    reservations = reservations
      .filter((r) => {
        const customer = r.Customer || {};
        const searchable = [
          customer.name,
          customer.email,
          customer.phone,
          r.resDate,
          r.resTime,
          r.resStatus,
          r.notes,
          r.paymentStatus,
        ];
        return searchable.some(
          (val) => val !== null && val !== undefined && String(val).toLowerCase().includes(term)
        );
      })
      .map((r) => {
        const { Customer, ...rest } = r;
        return Customer ? { ...rest, Customer } : rest;
      });
  }

  if (limit) {
    return { reservations, total: count };
  }
  return reservations;
};

const findReservationById = async (reservationId) => {
  const reservation = await Reservation.findOne({
    where: {
      id: reservationId,
    },
  });

  return reservation;
};

const createCustomer = async (customerDetails, t = null) => {
  return await Customer.create(
    {
      firstName: customerDetails.firstName,
      lastName: customerDetails.lastName,
      phone: customerDetails.phone,
      email: customerDetails.email,
      visitCount: 0,
      tags: [],
    },
    {
      transaction: t,
    }
  );
};

const findCustomerByEmail = async (email) => {
  return await Customer.findOne({ where: { email } });
};

const findOrCreateCustomer = async (customerDetails, t = null) => {
  const { email } = customerDetails;
  let customer = await findCustomerByEmail(email);
  if (!customer) {
    customer = await createCustomer(customerDetails, t);
  } else {
    await customer.increment("visitCount", { by: 1 });
    await customer.update({ lastVisitDate: new Date() });
  }
  return customer;
};

const updateCustomerTags = async (customerId, tags) => {
  const customer = await Customer.findByPk(customerId);
  if (!customer) return null;
  return await customer.update({ tags: Array.isArray(tags) ? tags : [] });
};

const updateCustomer = async (customerId, updates) => {
  const customer = await Customer.findByPk(customerId);
  if (!customer) return null;
  return await customer.update(updates);
};

const getCustomerById = async (customerId) => {
  const customer = await Customer.findByPk(customerId, {
    attributes: [
      "id",
      "firstName",
      "lastName",
      "email",
      "phone",
      "visitCount",
      "lastVisitDate",
      "tags",
      "points",
      "preferences",
    ],
  });
  if (customer && !Array.isArray(customer.tags)) {
    customer.tags = [];
  }
  return customer;
};

const incrementCustomerVisit = async (customerId) => {
  const customer = await Customer.findByPk(customerId);
  if (!customer) return null;
  await customer.increment("visitCount", { by: 1 });
  await customer.update({ lastVisitDate: new Date() });
  return customer;
};

const addCustomerPoints = async (customerId, points) => {
  const customer = await Customer.findByPk(customerId);
  if (!customer) return null;
  const nextPoints = (customer.points || 0) + points;
  await customer.update({ points: nextPoints });
  return customer;
};

const redeemCustomerPoints = async (customerId, points) => {
  const customer = await Customer.findByPk(customerId);
  if (!customer) return null;
  const current = customer.points || 0;
  if (current < points) {
    throw { status: 400, message: "Insufficient loyalty points." };
  }
  await customer.update({ points: current - points });
  return customer;
};

const updateCustomerPreferences = async (customerId, preferences) => {
  const customer = await Customer.findByPk(customerId);
  if (!customer) return null;
  return await customer.update({ preferences: preferences || {} });
};

const searchCustomers = async (query) => {
  const { Op } = db.Sequelize;
  const like = `%${query.replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;
  return await Customer.findAll({
    where: {
      [Op.or]: [
        { firstName: { [Op.like]: like } },
        { lastName: { [Op.like]: like } },
        { email: { [Op.like]: like } },
        { phone: { [Op.like]: like } },
      ],
    },
    limit: 20,
    attributes: ["id", "firstName", "lastName", "email", "phone", "visitCount"],
  });
};

const getCustomerReservationHistory = async (customerId, limit = 50) => {
  return await Reservation.findAll({
    where: { customerId },
    attributes: [
      "resStatus",
      [fn("SUM", col("expectedTotal")), "totalExpected"],
      [fn("COUNT", col("id")), "totalVisits"],
    ],
    group: ["resStatus"],
    raw: true,
  });
};

const getCustomerStats = async (customerId) => {
  const reservations = await Reservation.findAll({
    where: { customerId },
    attributes: [
      "resStatus",
      [fn("SUM", col("expectedTotal")), "totalExpected"],
      [fn("COUNT", col("id")), "totalVisits"],
    ],
    group: ["resStatus"],
    raw: true,
  });

  const totalVisits = reservations.reduce((sum, r) => sum + parseInt(r.totalVisits, 10), 0);
  const noShowCount = reservations
    .filter((r) => r.resStatus === "missed")
    .reduce((sum, r) => sum + parseInt(r.totalVisits, 10), 0);
  const noShowRate = totalVisits > 0 ? parseFloat((noShowCount / totalVisits) * 100).toFixed(2) : 0;

  return {
    totalVisits,
    noShowCount,
    noShowRate,
    statusBreakdown: reservations.map((r) => ({
      status: r.resStatus,
      count: parseInt(r.totalVisits, 10),
      totalExpected: parseFloat(r.totalExpected || 0),
    })),
  };
};
const createReservation = async (resDetails) => {
  const { resDate, resTime, people, notes, customerId, ...rest } = resDetails;
  const result = await db.sequelize.transaction(async (t) => {
    let finalCustomerId = customerId;

    if (!finalCustomerId) {
      const customer = await findOrCreateCustomer(rest, t);
      finalCustomerId = customer.id;
    }

    const reservation = await Reservation.create(
      {
        resDate: resDate,
        resTime: resTime,
        people: people,
        customerId: finalCustomerId,
        paymentStatus: resDetails.paymentStatus || "unpaid",
        expectedTotal: parseFloat(resDetails.expectedTotal || 0),
        notes: notes || null,
      },
      { transaction: t }
    );

    return reservation;
  });
  return result;
};

const statusHistoryDAO = require("../DAOs/reservationStatusHistory.dao");

const updateReservation = async (reservationId, resDetails) => {
  const [result, metadata] = await Reservation.update(resDetails, {
    where: {
      id: reservationId,
    },
  });

  return result;
};

const recordStatusChange = async (reservationId, fromStatus, toStatus, actorId, metadata = {}) => {
  return await statusHistoryDAO.addHistory({
    reservationId,
    fromStatus,
    toStatus,
    actorId,
    actorType: actorId ? "user" : "system",
    metadata,
  });
};

const getStatusHistory = async (reservationId) => {
  return await statusHistoryDAO.getHistoryByReservation(reservationId);
};

const mergeReservationTables = async (reservationId, tableIds) => {
  const reservation = await Reservation.findByPk(reservationId);
  if (!reservation) return null;
  const uniqueIds = Array.from(new Set((tableIds || []).map((id) => parseInt(id, 10)))).filter(Boolean);
  await reservation.update({ mergedFromTableIds: uniqueIds });
  return reservation;
};

const unmergeReservationTables = async (reservationId) => {
  const reservation = await Reservation.findByPk(reservationId);
  if (!reservation) return null;
  await reservation.update({ mergedFromTableIds: null });
  return reservation;
};

const deleteReservation = async (reservation) => {
  return await reservation.update({ resStatus: "cancelled" });
};

const destroyReservation = async (reservation) => {
  return await reservation.destroy();
};

const cancelReservation = async (reservationId, reservationDAO) => {
  const reservation = await reservationDAO.findReservationById(reservationId);
  if (!reservation) {
    throw {
      status: 404,
      message: "Given reservation doesn't exist!",
    };
  }

  if (["cancelled", "seated", "completed", "missed"].includes(reservation.resStatus)) {
    return await reservationDAO.destroyReservation(reservation);
  }

  return await reservationDAO.deleteReservation(reservation);
};

const setReservationStatus = async (reservation, status) => {
  reservation.resStatus = status;
  return await reservation.save();
};

const setReservationTable = async (
  reservationId,
  tableId,
  { neededTables = 1 } = {}
) => {
  const reservation = await Reservation.findByPk(reservationId);
  if (!reservation) {
    throw { status: 404, message: "Reservation not found!" };
  }

  const chosenTable = await Table.findByPk(tableId);
  if (!chosenTable) {
    throw { status: 404, message: "Table not found!" };
  }

  // Validate the chosen table can actually seat the party before occupying it.
  if (chosenTable.capacity && reservation.people > chosenTable.capacity) {
    throw {
      status: 400,
      message: `Table ${chosenTable.name || tableId} seats ${chosenTable.capacity} but party size is ${reservation.people}.`,
    };
  }

  const allFree = await Table.findAll({
    where: {
      isOccupied: false,
    },
  });

  const selected = [tableId];
  if (neededTables > 1) {
    const linked = allFree
      .filter((t) => t.id !== tableId)
      .slice(0, neededTables - 1)
      .map((t) => t.id);
    selected.push(...linked);
  }

  const linkedTableIds = selected.filter((id) => id !== tableId);

  // Wrap all occupancy + status writes in a transaction so a partial failure
  // cannot leave tables in an inconsistent state.
  return await db.sequelize.transaction(async (t) => {
    await Table.update(
      {
        isOccupied: true,
        reservationId: reservationId,
        linkedTableIds: linkedTableIds.length > 0 ? linkedTableIds : null,
      },
      { where: { id: tableId }, transaction: t }
    );

    if (linkedTableIds.length > 0) {
      await Table.update(
        {
          isOccupied: true,
          reservationId: reservationId,
        },
        { where: { id: linkedTableIds }, transaction: t }
      );
    }

    await Reservation.update(
      { resStatus: "seated" },
      { where: { id: reservationId }, transaction: t }
    );

    return reservation;
  });
};

const getReservationsHeatmap = async () => {
  const reservations = await Reservation.findAll({
    attributes: [
      [fn("DAYOFWEEK", col("resDate")), "dayOfWeek"],
      [fn("HOUR", col("resTime")), "hour"],
      [fn("COUNT", col("id")), "count"],
    ],
    where: {
      resDate: {
        [Op.gte]: db.sequelize.fn("DATE_SUB", db.sequelize.fn("CURDATE"), db.sequelize.literal("INTERVAL 30 DAY")),
      },
      resStatus: "pending",
    },
    group: [fn("DAYOFWEEK", col("resDate")), fn("HOUR", col("resTime"))],
    raw: true,
  });

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const heatmap = [];

  reservations.forEach((r) => {
    const dayName = days[r.dayOfWeek - 1] || "Sun";
    heatmap.push({
      day: dayName,
      hour: r.hour.toString().padStart(2, "0") + ":00",
      count: parseInt(r.count, 10),
    });
  });

  return heatmap;
};

const getHeatmapV2 = async (from, to, mode = "date-hour") => {
  const where = {
    resStatus: "pending",
  };
  if (from) where.resDate = { ...where.resDate, [Op.gte]: from };
  if (to) where.resDate = { ...where.resDate, [Op.lte]: to };

  if (mode === "calendar") {
    const results = await Reservation.findAll({
      attributes: [
        [col("resDate"), "date"],
        [fn("COUNT", col("id")), "count"],
        [fn("HOUR", fn("MIN", col("resTime"))), "peakHour"],
        [fn("COUNT", col("id")), "peakCount"],
      ],
      where,
      group: [col("resDate")],
      order: [[col("resDate"), "ASC"]],
      raw: true,
    });

    const days = results.map((r) => ({
      date: r.date,
      count: parseInt(r.count, 10),
      peakHour: r.peakHour !== null ? String(r.peakHour).padStart(2, "0") + ":00" : null,
      peakCount: parseInt(r.peakCount || r.count, 10),
    }));

    return { days };
  }

  const results = await Reservation.findAll({
    attributes: [
      ["resDate", "date"],
      [fn("HOUR", col("resTime")), "hour"],
      [fn("COUNT", col("id")), "count"],
    ],
    where,
    group: ["resDate", fn("HOUR", col("resTime"))],
    order: [["resDate", "ASC"]],
    raw: true,
  });

  const dateSet = new Set();
  const hourSet = new Set();
  const matrixMap = new Map();

  results.forEach((r) => {
    dateSet.add(r.date);
    hourSet.add(String(r.hour).padStart(2, "0"));
    const key = `${r.date}|${String(r.hour).padStart(2, "0")}`;
    matrixMap.set(key, parseInt(r.count, 10));
  });

  const dates = Array.from(dateSet).sort();
  const hours = Array.from(hourSet).sort();

  const matrix = dates.map((date) => {
    return hours.map((hour) => {
      const key = `${date}|${hour}`;
      return matrixMap.get(key) || 0;
    });
  });

  const totalsPerDay = dates.map((date) => {
    return matrix[dates.indexOf(date)].reduce((sum, count) => sum + count, 0);
  });

  const totalsPerHour = hours.map((hour) => {
    let sum = 0;
    matrix.forEach((row) => {
      sum += row[hours.indexOf(hour)];
    });
    return sum;
  });

  return {
    dates,
    hours,
    matrix,
    totalsPerDay,
    totalsPerHour,
  };
};

const getPaymentStatusCounts = async () => {
  const results = await Reservation.findAll({
    attributes: [
      ["paymentStatus", "status"],
      [fn("COUNT", col("id")), "count"],
    ],
    group: ["paymentStatus"],
    raw: true,
  });

  const counts = {
    deposit: 0,
    partial: 0,
    paid: 0,
    unpaid: 0,
  };

  results.forEach((r) => {
    counts[r.status] = parseInt(r.count, 10);
  });

  return counts;
};

const bulkCancel = async (ids) => {
  const result = await db.sequelize.transaction(async (t) => {
    const reservations = await Reservation.findAll({
      where: { id: ids },
      transaction: t,
    });
    const cancellable = reservations.filter((r) => r.resStatus !== "seated");
    if (cancellable.length === 0) return { count: 0 };
    const [count] = await Reservation.update(
      { resStatus: "cancelled" },
      {
        where: { id: cancellable.map((r) => r.id) },
        transaction: t,
      }
    );
    return { count: count || cancellable.length };
  });
  return result;
};

const bulkUpdate = async (ids, updates) => {
  const count = await Reservation.update(updates, {
    where: { id: ids },
  });
  return { count };
};

const getAssignedStaff = async (reservationId) => {
  const reservation = await Reservation.findByPk(reservationId, {
    include: [
      {
        model: db.user,
        through: { attributes: [] },
        attributes: ["id", "username", "email", "role", "permissions"],
      },
    ],
  });
  return reservation ? reservation.Users : [];
};

const assignStaff = async (reservationId, userId) => {
  const reservation = await Reservation.findByPk(reservationId);
  if (!reservation) return null;
  const user = await db.user.findByPk(userId);
  if (!user) return null;
  await reservation.addUser(user);
  return { reservationId, userId };
};

const unassignStaff = async (reservationId, userId) => {
  const reservation = await Reservation.findByPk(reservationId);
  if (!reservation) return null;
  const user = await db.user.findByPk(userId);
  if (!user) return null;
  await reservation.removeUser(user);
  return { reservationId, userId };
};

const findAllReservationsRaw = async (where = {}) => {
  return await Reservation.findAll({ where });
};

const searchReservationsByNotes = async (query) => {
  const searchTerm = query.trim();
  if (!searchTerm) return [];

  const reservations = await db.sequelize.query(
    `SELECT r.id, r.customerId, r.resDate, r.resTime, r.resStatus, r.people, r.paymentStatus, r.expectedTotal, r.notes, 
     c.firstName, c.lastName, c.email, c.phone, c.tags,
      MATCH(r.notes) AGAINST (:searchTerm IN NATURAL LANGUAGE MODE) as relevance
      FROM Reservations r
      JOIN customers c ON r.customerId = c.id
     WHERE MATCH(r.notes) AGAINST (:searchTerm IN NATURAL LANGUAGE MODE)
     ORDER BY relevance DESC
     LIMIT 50`,
    {
      replacements: { searchTerm },
      type: db.sequelize.QueryTypes.SELECT,
    }
  );

  return flattenArrayObjects(reservations);
};

const getReservationStats = async (filters = {}) => {
  const where = {};
  if (filters.from) where.resDate = { ...where.resDate, [Op.gte]: filters.from };
  if (filters.to) where.resDate = { ...where.resDate, [Op.lte]: filters.to };
  if (filters.paymentStatus) where.paymentStatus = filters.paymentStatus;
  if (filters.resStatus) where.resStatus = filters.resStatus;

  const reservations = await Reservation.findAll({ where });

  const paymentBreakdown = await Reservation.findAll({
    where: { ...where, paymentStatus: { [Op.ne]: null } },
    attributes: [
      "paymentStatus",
      [fn("COUNT", col("id")), "count"],
      [fn("COALESCE", fn("SUM", col("people")), 0), "totalPeople"],
    ],
    group: ["paymentStatus"],
    raw: true,
  });

  const resStatusBreakdown = await Reservation.findAll({
    where,
    attributes: [
      "resStatus",
      [fn("COUNT", col("id")), "count"],
    ],
    group: ["resStatus"],
    raw: true,
  });

  const total = reservations.length;
  const noShowCount = reservations.filter((r) => r.resStatus === "missed").length;
  const noShowRate = total > 0 ? parseFloat((noShowCount / total) * 100).toFixed(2) : 0;

  return {
    paymentBreakdown,
    resStatusBreakdown,
    noShowCount,
    noShowRate,
    total,
  };
};

const searchReservations = async (term) => {
  const like = `%${term.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;
  const where = {
    [Op.or]: [
      { resDate: { [Op.like]: like } },
      { resTime: { [Op.like]: like } },
      { notes: { [Op.like]: like } },
      { "$customer.name$": { [Op.like]: like } },
      { "$customer.email$": { [Op.like]: like } },
      { "$customer.phone$": { [Op.like]: like } },
      { "$customer.tags$": { [Op.like]: like } },
      { "$table.name$": { [Op.like]: like } },
    ],
  };
  const num = parseInt(term, 10);
  if (!Number.isNaN(num)) {
    where[Op.or].push({ people: num });
  }
  return await Reservation.findAll({
    where,
    include: [
      {
        model: Customer,
        attributes: [
          [fn("CONCAT", col("firstName"), " ", col("lastName")), "name"],
          "email",
          "phone",
          "tags",
        ],
        required: false,
      },
      {
        model: Table,
        attributes: ["id", "name", "capacity"],
        required: false,
      },
    ],
    limit: 50,
    order: [["resDate", "DESC"], ["resTime", "DESC"]],
  });
};

const getRecurringReservations = async (customerId) => {
  const { Op } = db.Sequelize;
  const reservations = await Reservation.findAll({
    where: {
      customerId,
      recurrence: {
        [Op.not]: null,
      },
    },
    order: [["resDate", "ASC"]],
    attributes: ["id", "resDate", "resTime", "people", "recurrence"],
  });

  return reservations.map((reservation) => {
    const recurrence = reservation.recurrence || {};
    return {
      id: reservation.id,
      resDate: reservation.resDate,
      resTime: reservation.resTime,
      people: reservation.people,
      recurrence: {
        frequency: recurrence.frequency || null,
        interval: recurrence.interval || null,
        until: recurrence.until || null,
        byDay: recurrence.byDay || [],
      },
    };
  });
};

module.exports = {
  findAllReservations,
  createReservation,
  updateReservation,
  recordStatusChange,
  getStatusHistory,
  mergeReservationTables,
  unmergeReservationTables,
  getCustomerById,
  incrementCustomerVisit,
  addCustomerPoints,
  redeemCustomerPoints,
  updateCustomerPreferences,
  searchCustomers,
  getRecurringReservations,
  findAllReservationsRaw,
  getReservationStats,
  getAssignedStaff,
  assignStaff,
  unassignStaff,
  getReservationsHeatmap,
  getHeatmapV2,
  getPaymentStatusCounts,
  bulkCancel,
  bulkUpdate,
  findOrCreateCustomer,
  findCustomerByEmail,
  createCustomer,
  updateCustomerTags,
  cancelReservation,
  setReservationStatus,
  setReservationTable,
};