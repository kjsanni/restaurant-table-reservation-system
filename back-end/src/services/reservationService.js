const dateTimeValidator = require("../utils/dateAndTimeValidator");

const getAllReservations = async (reservationDAO, filters = {}) => {
  if (Object.keys(filters).length > 0) {
    return await reservationDAO.searchReservations(filters);
  }
  return await reservationDAO.findAllReservations();
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

  if (compareResDateToCurrDate(reservation.resDate, currDateStr) === -1) {
    await reservationDAO.setReservationStatus(reservation, "missed");
  }

  /**
   * if the reservation day is in the past (compared to current date)
   *  => update the reservation's status to 'missed'
   */

  if (compareResDateToCurrDate(reservation.resDate, currDateStr) === -1) {
    await reservationDAO.setReservationStatus(reservation, "missed");
  }

  /**
   * If the reservation day is equal to current day
   *  and reservation time is the past (compared to current date - 30 minutes)
   *  => update the reservation's status to missed
   */
  if (compareResDateToCurrDate(reservation.resDate, currDateStr) === 0) {
    const twoMinsAgo = new Date(currDate);
    twoMinsAgo.setMinutes(twoMinsAgo.getMinutes() - 2);
    const currTimePlus2minsStr = dateTimeValidator.asTimeString(twoMinsAgo);
    if (currTimePlus2minsStr > reservation?.resTime) {
      reservation = await reservationDAO.setReservationStatus(
        reservation,
        "missed"
      );
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

module.exports = {
  getAllReservations,
  registerReservation,
  editReservation,
  cancelReservation,
  chooseTable,
};
