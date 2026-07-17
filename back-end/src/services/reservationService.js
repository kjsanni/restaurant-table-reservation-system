const dateTimeValidator = require("../utils/dateAndTimeValidator");
const scheduleService = require("./scheduleService");
const webhookService = require("./webhook.service");

const getAllReservations = async (reservationDAO, filters = {}, pagination = {}, tenantId) => {
  if (Object.keys(filters).length > 0) {
    return await reservationDAO.searchReservations(filters, pagination, tenantId);
  }
  return await reservationDAO.findAllReservations(pagination, tenantId);
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

const registerReservation = async (reservationDAO, payload, tenantId) => {
  const authDAO = require("../DAOs/auth.dao");

  const maintenance = await authDAO.getSettingValue(
    "maintenance_mode",
    { enabled: false, message: "" },
    tenantId
  );
  if (maintenance && maintenance.enabled) {
    throw {
      status: 503,
      message:
        maintenance.message ||
        "Online booking is temporarily unavailable for maintenance. Please contact us directly.",
    };
  }

  isFieldEmpty(payload);
  validateTime(new Date(), payload.resDate, payload.resTime);

  const window = await authDAO.getSettingValue(
    "reservation_window",
    { minLeadMinutes: 0, maxLeadDays: 365, maxPerSlot: 1 },
    tenantId
  );
  if (window) {
    const resDateTime = new Date(`${payload.resDate}T${payload.resTime}`);
    const now = new Date();
    if (window.minLeadMinutes && resDateTime.getTime() - now.getTime() < window.minLeadMinutes * 60000) {
      throw {
        status: 400,
        message: `Reservations must be made at least ${window.minLeadMinutes} minute(s) in advance.`,
      };
    }
    if (window.maxLeadDays) {
      const maxDate = new Date(now.getTime() + window.maxLeadDays * 86400000);
      if (resDateTime.getTime() > maxDate.getTime()) {
        throw {
          status: 400,
          message: `Reservations cannot be made more than ${window.maxLeadDays} days in advance.`,
        };
      }
    }
  }


  try {
    const scheduleDAO = require("../DAOs/schedule.dao");
    const holidayDAO = require("../DAOs/schedule.dao");
    await scheduleService.checkScheduleAvailability(
      scheduleDAO,
      holidayDAO,
      payload.resDate,
      payload.resTime
    );
    await scheduleService.checkBusinessHours(
      payload.resDate,
      payload.resTime,
      tenantId
    );
  } catch (err) {
    if (err && err.status) throw err;
    throw { status: 500, message: "Unable to verify schedule availability." };
  }

  const { checkUsageLimit } = require("../tenant-platform/services/tenantSubscription.service");
  await checkUsageLimit(tenantId, "reservations");

  const customer = await reservationDAO.findOrCreateCustomer(
    {
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      phone: payload.phone,
    },
    null,
    tenantId
  );

  const data = {
    ...payload,
    customerId: customer.id,
    paymentStatus: payload.paymentStatus || "unpaid",
  };

  const reservation = await reservationDAO.createReservation(data, tenantId);
  webhookService.dispatch("reservation.created", reservation, tenantId);
  return reservation;
};

const editReservation = async (reservationId, reservationDAO, payload, tenantId) => {
  const reservation = await reservationDAO.findReservationById(reservationId, tenantId);
  if (!reservation)
    throw {
      status: 404,
      message: "Reservation not found!",
    };
  validateTime(new Date(), payload.resDate, payload.resTime);
  const updated = await reservationDAO.updateReservation(reservationId, payload, tenantId);
  webhookService.dispatch("reservation.updated", updated, tenantId);
  return updated;
};

const cancelReservation = async (reservationId, reservationDAO, tenantId) => {
  const reservation = await reservationDAO.findReservationById(reservationId, tenantId);
  if (!reservation) {
    throw {
      status: 404,
      message: "Reservation not found!",
    };
  }
  if (["cancelled", "seated", "completed", "missed"].includes(reservation.resStatus)) {
    const result = await reservationDAO.destroyReservation(reservation, tenantId);
    webhookService.dispatch("reservation.cancelled", result, tenantId);
    return result;
  }
  const result = await reservationDAO.deleteReservation(reservationId, tenantId);
  webhookService.dispatch("reservation.cancelled", result, tenantId);
  return result;
};

const compareResDateToCurrDate = (resDate, currDate) => {
  return resDate > currDate ? 1 : resDate < currDate ? -1 : 0;
};

const chooseTable = async (
  reservationId,
  tableId,
  reservationDAO,
  tableDAO,
  tenantId
) => {
  let reservation = await reservationDAO.findReservationById(reservationId, tenantId);
  if (!reservation) {
    throw {
      status: 404,
      message: "Reservation not found!",
    };
  }
  const table = await tableDAO.findTableById(tableId, tenantId);

  const currDate = new Date();
  const currDateStr = dateTimeValidator.asDateString(currDate);

  if (
    compareResDateToCurrDate(reservation.resDate, currDateStr) === -1 &&
    reservation.resStatus !== "missed" &&
    reservation.resStatus !== "cancelled"
  ) {
    reservation = await reservationDAO.setReservationStatus(reservation, "missed", tenantId);
    throw {
      status: 400,
      message: "Cannot seat a past reservation.",
    };
  }

  if (compareResDateToCurrDate(reservation.resDate, currDateStr) === 0) {
    const graceEnd = new Date(currDate);
    graceEnd.setMinutes(graceEnd.getMinutes() - 30);
    const graceEndStr = dateTimeValidator.asTimeString(graceEnd);
    if (
      graceEndStr > reservation.resTime &&
      reservation.resStatus !== "seated" &&
      reservation.resStatus !== "cancelled"
    ) {
      reservation = await reservationDAO.setReservationStatus(reservation, "missed", tenantId);
      throw {
        status: 400,
        message: "Reservation is past the grace period and has been marked as missed.",
      };
    }
  }
  if (reservation.resStatus === "seated") {
    throw {
      status: 400,
      message:
        "You've already reserved a table! Please make a new reservation.",
    };
  }
  if (!tableId || !table) {
    throw {
      status: 400,
      message: "Please select a valid table!",
    };
  }
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
  }, tenantId);
};

const paymentDAO = require("../DAOs/payment.dao");

const getRevenueTimeSeries = async (from, to, granularity = "day") => {
  return await paymentDAO.getRevenueTimeSeries(from, to, granularity);
};

const searchReservations = async (reservationDAO, query, tenantId) => {
  const term = query.trim();
  if (!term) return [];
  const results = await reservationDAO.searchReservations(term, tenantId);
  return results;
};

const getRecurringReservations = async (reservationDAO, customerId, tenantId) => {
  return await reservationDAO.getRecurringReservations(customerId, tenantId);
};

const recordStatusChange = async (reservationDAO, reservationId, fromStatus, toStatus, actorId, metadata = {}, tenantId) => {
  await reservationDAO.recordStatusChange(reservationId, fromStatus, toStatus, actorId, metadata, tenantId);
  return true;
};

const getStatusHistory = async (reservationDAO, reservationId, tenantId) => {
  return await reservationDAO.getStatusHistory(reservationId, tenantId);
};

const mergeReservationTables = async (reservationDAO, reservationId, tableIds, primaryTableId, tenantId) => {
  const uniqueTableIds = Array.from(new Set((tableIds || []).map((id) => parseInt(id, 10)))).filter(Boolean);
  if (!uniqueTableIds.length) {
    throw { status: 400, message: "Provide at least one table to merge." };
  }
  return await reservationDAO.mergeReservationTables(reservationId, uniqueTableIds, primaryTableId, tenantId);
};

const unmergeReservationTables = async (reservationDAO, reservationId, tenantId) => {
  return await reservationDAO.unmergeReservationTables(reservationId, tenantId);
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
  getRevenueTimeSeries,
};
