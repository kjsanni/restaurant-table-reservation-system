const db = require("../db/models");
const { fn, col } = db.sequelize;
const { Op } = db.Sequelize;
const Reservation = db.reservation;
const Customer = db.customer;
const Table = db.table;
const { flattenArrayObjects } = require("../utils/flattenObject");

const findAllReservations = async () => {
  const reservations = await Reservation.findAll({
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
    ],
  });
  return flattenArrayObjects(reservations);
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
  return await Customer.findByPk(customerId, {
    attributes: [
      "id",
      "firstName",
      "lastName",
      "email",
      "phone",
      "visitCount",
      "lastVisitDate",
      "tags",
    ],
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
  const { resDate, resTime, people, notes, ...customerDetails } = resDetails;
  const result = await db.sequelize.transaction(async (t) => {
    const customer = await findOrCreateCustomer(customerDetails, t);

    const reservation = await Reservation.create(
      {
        resDate: resDate,
        resTime: resTime,
        people: people,
        customerId: customer.id,
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

const updateReservation = async (reservationId, resDetails) => {
  const [result, metadata] = await Reservation.update(resDetails, {
    where: {
      id: reservationId,
    },
  });

  return result;
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

const setReservationTable = async (reservationId, tableId) => {
  await Table.update(
    {
      isOccupied: true,
      reservationId: reservationId,
    },
    {
      where: {
        id: tableId,
      },
    }
  );
  return await Reservation.update(
    {
      resStatus: "seated",
    },
    {
      where: {
        id: reservationId,
      },
    }
  );
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
     FROM reservations r
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

module.exports = {
  findAllReservations,
  createReservation,
  updateReservation,
  deleteReservation,
  destroyReservation,
  cancelReservation,
  findReservationById,
  setReservationTable,
  setReservationStatus,
  getReservationsHeatmap,
  getHeatmapV2,
  getPaymentStatusCounts,
  bulkCancel,
  bulkUpdate,
  getAssignedStaff,
  assignStaff,
  unassignStaff,
  findAllReservationsRaw,
  getReservationStats,
  createCustomer,
  findCustomerByEmail,
  findOrCreateCustomer,
  updateCustomerTags,
  updateCustomer,
  getCustomerById,
  getCustomerReservationHistory,
  getCustomerStats,
  searchReservationsByNotes,
};