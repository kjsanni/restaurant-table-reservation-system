const reservationService = require("../services/reservationService");
const reservationDAO = require("../DAOs/reservation.dao");
const paymentDAO = require("../DAOs/payment.dao");
const tableDAO = require("../DAOs/table.dao");

jest.mock("../utils/pdfGenerator");
jest.mock("../db/models", () => {
  const Sequelize = { Op: {}, fn: jest.fn(), col: jest.fn() };
  return {
    sequelize: {
      transaction: jest.fn((fn) => fn({
        update: jest.fn().mockResolvedValue([1]),
      })),
    },
    Sequelize,
    payment: {
      findAndCountAll: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
    },
    table: {
      findOne: jest.fn(),
      update: jest.fn(),
      findAll: jest.fn(),
    },
    loginAttempt: {
      count: jest.fn(),
      findOne: jest.fn(),
      destroy: jest.fn(),
    },
    reservation: {
      findOne: jest.fn(),
      update: jest.fn(),
    },
    tenant: { findByPk: jest.fn() },
  };
});

const db = require("../db/models");
const paymentModel = db.payment;

const { formatPhoneNumber } = require("../services/whatsapp.service");

describe("Reservation — chooseTable past-date guard", () => {
  beforeEach(() => {
    jest.spyOn(reservationDAO, 'findReservationById').mockResolvedValue(null);
    jest.spyOn(reservationDAO, 'setReservationStatus').mockResolvedValue({ id: 1, resStatus: 'missed' });
    jest.spyOn(tableDAO, 'findTableById').mockResolvedValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("throws when the reservation date is in the past", async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    const pastDateStr = `${pastDate.getFullYear()}-${String(pastDate.getMonth() + 1).padStart(2, "0")}-${String(pastDate.getDate()).padStart(2, "0")}`;

    reservationDAO.findReservationById.mockResolvedValue({
      id: 1,
      resDate: pastDateStr,
      resStatus: "pending",
      people: 2,
      tenantId: 1,
    });

    await expect(
      reservationService.chooseTable(1, 1, reservationDAO, tableDAO, 1)
    ).rejects.toMatchObject({
      status: 400,
      message: "Cannot seat a past reservation.",
    });

    expect(reservationDAO.setReservationStatus).toHaveBeenCalledWith(
      expect.anything(),
      "missed",
      1
    );
  });

  it("throws when the reservation is past the grace period", async () => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const pastTime = new Date(today);
    pastTime.setMinutes(pastTime.getMinutes() - 45);
    const pastTimeStr = `${String(pastTime.getHours()).padStart(2, "0")}:${String(pastTime.getMinutes()).padStart(2, "0")}:00`;

    reservationDAO.findReservationById.mockResolvedValue({
      id: 2,
      resDate: todayStr,
      resTime: pastTimeStr,
      resStatus: "pending",
      people: 2,
      tenantId: 1,
    });

    await expect(
      reservationService.chooseTable(2, 1, reservationDAO, tableDAO, 1)
    ).rejects.toMatchObject({
      status: 400,
      message: "Reservation is past the grace period and has been marked as missed.",
    });
  });
});

describe("Reservation — mergeReservationTables", () => {
  beforeEach(() => jest.clearAllMocks());

  it("wraps table updates in a transaction", async () => {
    db.reservation.findOne.mockResolvedValue({ id: 10, update: jest.fn().mockResolvedValue(true) });
    db.table.update.mockResolvedValue([1]);

    const result = await reservationDAO.mergeReservationTables(10, [1, 2, 3], 1, 1);

    expect(result).not.toBeNull();
    expect(db.sequelize.transaction).toHaveBeenCalledTimes(1);
  });

  it("returns null when reservation does not exist", async () => {
    db.reservation.findOne.mockResolvedValue(null);
    const result = await reservationDAO.mergeReservationTables(999, [1], 1, 1);
    expect(result).toBeNull();
  });
});

describe("Auth — sliding window lockout", () => {
  beforeEach(() => jest.clearAllMocks());

  it("locks out when 5 attempts occur within sliding window of most recent attempt", async () => {
    const now = Date.now();
    const attempts = Array.from({ length: 5 }, (_, i) => ({
      email: "test@example.com",
      ipAddress: "127.0.0.1",
      attemptedAt: new Date(now - (4 - i) * 60 * 1000),
    }));

    db.loginAttempt.count.mockResolvedValue(5);
    db.loginAttempt.findOne.mockResolvedValue({
      attemptedAt: new Date(now - 1 * 60 * 1000),
    });

    const result = await require("../DAOs/auth.dao").checkLoginLockout(
      "test@example.com",
      "127.0.0.1",
      1
    );

    expect(result.locked).toBe(true);
    expect(result.remainingSeconds).toBeGreaterThan(0);
  });

  it("clears attempts older than sliding window from most recent attempt", async () => {
    const now = Date.now();
    const mostRecent = new Date(now - 1 * 60 * 1000);
    db.loginAttempt.findOne.mockResolvedValue({ attemptedAt: mostRecent });
    db.loginAttempt.destroy.mockResolvedValue(2);

    const result = await require("../DAOs/auth.dao").clearLoginAttempts(
      "test@example.com",
      "127.0.0.1",
      1
    );

    expect(db.loginAttempt.destroy).toHaveBeenCalledTimes(1);
    expect(result).toBe(2);
  });
});

describe("WhatsApp — phone formatting", () => {
  it("formats 9-digit Ghana numbers with 233 prefix", () => {
    const formatted = formatPhoneNumber("241234567");
    expect(formatted).toBe("233241234567");
  });

  it("preserves already international numbers", () => {
    const formatted = formatPhoneNumber("+233241234567");
    expect(formatted).toBe("233241234567");
  });

  it("returns null for empty input", () => {
    expect(formatPhoneNumber("")).toBeNull();
    expect(formatPhoneNumber(null)).toBeNull();
  });

  it("preserves 10-digit numbers starting with 0", () => {
    const formatted = formatPhoneNumber("0241234567");
    expect(formatted).toBe("0241234567");
  });
});

describe("Payment — server-side pagination", () => {
  it("returns paginated payment history with metadata", async () => {
    const mockPayments = [
      { id: 1, amount: 100, method: "cash" },
      { id: 2, amount: 200, method: "card" },
    ];

    db.payment.findAndCountAll.mockResolvedValue({
      rows: mockPayments,
      count: 2,
    });

    const result = await paymentDAO.getPaymentHistory({}, 1, {
      limit: 10,
      offset: 0,
    });

    expect(result.collection).toEqual(mockPayments);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.totalPages).toBe(1);
  });

  it("returns all payments when no pagination is provided", async () => {
    const mockPayments = [
      { id: 1, amount: 100 },
      { id: 2, amount: 200 },
      { id: 3, amount: 300 },
    ];

    db.payment.findAndCountAll.mockResolvedValue({
      rows: mockPayments,
      count: 3,
    });

    const result = await paymentDAO.getPaymentHistory({}, 1);

    expect(result.collection).toEqual(mockPayments);
    expect(result.total).toBe(3);
    expect(result.page).toBeUndefined();
    expect(result.pageSize).toBeUndefined();
  });
});
