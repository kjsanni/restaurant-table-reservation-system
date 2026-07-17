// Schedule availability + table capacity coverage
const scheduleService = require("../services/scheduleService");
const reservationDAO = require("../DAOs/reservation.dao");

jest.mock("../DAOs/schedule.dao");
jest.mock("../db/models", () => {
  const Sequelize = { Op: {}, fn: jest.fn(), col: jest.fn() };
  return {
    sequelize: { transaction: jest.fn((fn) => fn({ update: jest.fn() })) },
    Sequelize,
    reservation: { findOne: jest.fn() },
    table: { findOne: jest.fn(), findAll: jest.fn(), update: jest.fn() },
  };
});

const scheduleDAO = require("../DAOs/schedule.dao");
const holidayDAO = require("../DAOs/schedule.dao");
const db = require("../db/models");

describe("Schedule — checkScheduleAvailability", () => {
  beforeEach(() => jest.clearAllMocks());

  it("throws when no schedule is configured for the day", async () => {
    scheduleDAO.getScheduleByDay.mockResolvedValue(null);
    holidayDAO.getHolidayByDate.mockResolvedValue(null);

    await expect(
      scheduleService.checkScheduleAvailability(
        scheduleDAO,
        holidayDAO,
        "2099-01-05",
        "12:00"
      )
    ).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining("No schedule configured"),
    });
  });

  it("throws when the day is closed in schedule", async () => {
    scheduleDAO.getScheduleByDay.mockResolvedValue({ isClosed: true, dayOfWeek: "monday" });
    holidayDAO.getHolidayByDate.mockResolvedValue(null);

    await expect(
      scheduleService.checkScheduleAvailability(
        scheduleDAO,
        holidayDAO,
        "2099-01-05",
        "12:00"
      )
    ).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining("closed"),
    });
  });

  it("throws when the date is a closed holiday", async () => {
    scheduleDAO.getScheduleByDay.mockResolvedValue({ isClosed: false, dayOfWeek: "tuesday" });
    holidayDAO.getHolidayByDate.mockResolvedValue({
      isClosed: true,
      description: "New Year",
    });

    await expect(
      scheduleService.checkScheduleAvailability(
        scheduleDAO,
        holidayDAO,
        "2099-01-01",
        "12:00"
      )
    ).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining("closed"),
    });
  });

  it("returns schedule and holiday when open", async () => {
    scheduleDAO.getScheduleByDay.mockResolvedValue({ isClosed: false, openTime: "08:00", closeTime: "22:00" });
    holidayDAO.getHolidayByDate.mockResolvedValue({ isClosed: false, slotDuration: 30 });

    const result = await scheduleService.checkScheduleAvailability(
      scheduleDAO,
      holidayDAO,
      "2099-01-02",
      "12:00"
    );

    expect(result.daySchedule).toBeTruthy();
    expect(result.holiday).toBeTruthy();
  });
});

describe("Tables — capacity enforcement", () => {
  beforeEach(() => jest.clearAllMocks());

  it("setReservationTable throws when table capacity is too small", async () => {
    db.reservation.findOne.mockResolvedValue({ id: 1, people: 6 });
    db.table.findOne.mockResolvedValue({ id: 10, name: "T10", capacity: 2, isOccupied: false });
    db.table.findAll.mockResolvedValue([]);

    await expect(
      reservationDAO.setReservationTable(1, 10, { neededTables: 1 }, null)
    ).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining("seats 2 but party size is 6"),
    });
  });
});
