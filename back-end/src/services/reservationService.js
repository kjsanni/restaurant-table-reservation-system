const dateTimeValidator = require("../utils/dateAndTimeValidator");
const scheduleService = require("./scheduleService");

const getAllReservations = async (reservationDAO, filters = {}, pagination = {}) => {
  if (Object.keys(filters).length > 0) {
    return await reservationDAO.searchReservations(filters, pagination);
  }
  return await reservationDAO.findAllReservations(pagination);
};

const checkClosingOpeningTime = (
  currDate,
  currTime,
  resDate,
  resTime,
  scheduleService
) => {
  const openingTime = scheduleService.getOpeningTime(currDate);
  const closingTime = scheduleService.getClosingTime(currDate);

  if (resTime < openingTime || resTime >= closingTime) {
    throw {
      status: 400,
      message: `Restaurant opening time is ${openingTime} and closing time is ${closingTime}!`,
    };
  }
};

const validateTime = (currDate, resDate, resTime, scheduleService = null) => {
  if (resDate === dateTimeValidator.asDateString(currDate)) {
    if (resTime < dateTimeValidator.asTimeString(currDate)) {
      throw {
        status: 400,
        message: "ERROR: Given time is in the past!",
      };
    }
  }
  if (scheduleService) {
    checkClosingOpeningTime(currDate, dateTimeValidator.asTimeString(currDate), resDate, resTime, scheduleService);
  }
};

const isFieldEmpty = (payload) => {
  if (
    !payload.firstName ||
    !payload.lastName ||
    !payload.phone ||
    !payload.email ||
    !payload.resDate ||
    !payload.resTime ||
    !payload.people
  ) {
    throw {
      status: 400,
      message: "Please fill in all fields!",
    };
  }
};

const registerReservation = async (reservationDAO, payload) => {
  isFieldEmpty(payload);
  validateTime(new Date(), payload.resDate, payload.resTime);

  // Enforce opening hours, closed days, and holiday closures before creating.
  try {
    const scheduleDAO = require("../DAOs/schedule.dao");
    const holidayDAO = require("../DAOs/holiday.dao");
    await scheduleService.checkScheduleAvailability(
      scheduleDAO,
      holidayDAO,
      payload.resDate,
      payload.resTime
    );
  } catch (err) {
    if (err && err.status) throw err;
    throw { status: 500, message: "Unable to verify schedule availability." };
  }

  const customer = await reservationDAO.findOrCreateCustomer({
    email: payload.email,
    firstName: payload.firstName,
    lastName: payload.lastName,
    phone: payload.phone,
  });

  const data = {
    ...payload,
    customerId: customer.id,
    paymentStatus: payload.paymentStatus || "unpaid",
  };

  return await reservationDAO.createReservation(data);
};

const editReservation = async (reservationId, reservationDAO, payload) => {
  const reservation = await reservationDAO.findReservationById(reservationId);
  if (!reservation)
    throw {
      status: 404,
      message: "Reservation not found!",
    };
  validateTime(new Date(), payload.resDate, payload.resTime);
  return await reservationDAO.updateReservation(reservationId, payload);
};

const cancelReservation = async (reservationId, reservationDAO) => {
  return await reservationDAO.cancelReservation(reservationId, reservationDAO);
};

const compareResDateToCurrDate = (resDate, currDate) => {
  return resDate > currDate ? 1 : resDate < currDate ? -1 : 0;
};

const chooseTable = async (
  reservationId,
  tableId,
  reservationDAO,
  tableDAO
) => {
  let reservation = await reservationDAO.findReservationById(reservationId);
  if (!reservation) {
    throw {
      status: 404,
      message: "Reservation not found!",
    };
  }
  const table = await tableDAO.findTableById(tableId);

  const currDate = new Date();
  const currDateStr = dateTimeValidator.asDateString(currDate);

  // Past reservation day (and not already resolved) => mark as missed.
  if (
    compareResDateToCurrDate(reservation.resDate, currDateStr) === -1 &&
    reservation.resStatus !== "missed" &&
    reservation.resStatus !== "cancelled"
  ) {
    reservation = await reservationDAO.setReservationStatus(reservation, "missed");
  }

  // Same-day reservation whose time has passed the 30-minute grace window => missed.
  if (compareResDateToCurrDate(reservation.resDate, currDateStr) === 0) {
    const graceEnd = new Date(currDate);
    graceEnd.setMinutes(graceEnd.getMinutes() - 30);
    const graceEndStr = dateTimeValidator.asTimeString(graceEnd);
    if (
      graceEndStr > reservation.resTime &&
      reservation.resStatus !== "seated" &&
      reservation.resStatus !== "cancelled"
    ) {
      reservation = await reservationDAO.setReservationStatus(reservation, "missed");
    }
  }
  /**
   *
   * if reservation.resStatus === 'seated'
   *  => throw error => "You've already reserved a table. Please make a new reservation."
   * missed reservations can still be seated if a table is free
   */
  if (reservation.resStatus === "seated") {
    throw {
      status: 400,
      message:
        "You've already reserved a table! Please make a new reservation.",
    };
  }
  /**
   *
   * If the given table is already occupied throw an error
   */
  if (table.isOccupied)
    throw {
      status: 400,
      message: "Given table is already reserved!",
    };

  const neededTables = Math.ceil(
    (reservation.people || 0) / Math.max(table.capacity, 1)
  );

  return await reservationDAO.setReservationTable(reservationId, tableId, {
    neededTables,
  });
};

const searchReservations = async (reservationDAO, query) => {
  const term = query.trim();
  if (!term) return [];
  const results = await reservationDAO.searchReservations(term);
  return results;
};

const getRecurringReservations = async (reservationDAO, customerId) => {
  return await reservationDAO.getRecurringReservations(customerId);
};

const recordStatusChange = async (reservationDAO, reservationId, fromStatus, toStatus, actorId, metadata = {}) => {
  await reservationDAO.recordStatusChange(reservationId, fromStatus, toStatus, actorId, metadata);
  return true;
};

const getStatusHistory = async (reservationDAO, reservationId) => {
  return await reservationDAO.getStatusHistory(reservationId);
};

const mergeReservationTables = async (reservationDAO, reservationId, tableIds) => {
  const uniqueTableIds = Array.from(new Set((tableIds || []).map((id) => parseInt(id, 10)))).filter(Boolean);
  if (!uniqueTableIds.length) {
    throw { status: 400, message: "Provide at least one table to merge." };
  }
  return await reservationDAO.mergeReservationTables(reservationId, uniqueTableIds);
};

const unmergeReservationTables = async (reservationDAO, reservationId) => {
  return await reservationDAO.unmergeReservationTables(reservationId);
};

module.exports = {
  getAllReservations,
  registerReservation,
  editReservation,
  cancelReservation,
  chooseTable,
  searchReservations,
  getRecurringReservations,
  recordStatusChange,
  getStatusHistory,
  mergeReservationTables,
  unmergeReservationTables,
};
