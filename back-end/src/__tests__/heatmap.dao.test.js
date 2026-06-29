const { Sequelize } = require("sequelize");

jest.mock("../db/models", () => {
  const SequelizeLib = require("sequelize");
  const mockFindAll = jest.fn();
  const MockReservation = {
    findAll: mockFindAll,
  };
  return {
    Sequelize: SequelizeLib,
    reservation: MockReservation,
    sequelize: {
      fn: jest.fn(),
      col: jest.fn(),
      Op: SequelizeLib.Op,
      literal: jest.fn(),
    },
  };
});

const db = require("../db/models");
const { Op } = db.Sequelize;
const { fn, col } = db.sequelize;
const Reservation = db.reservation;
const reservationDAO = require("../DAOs/reservation.dao");

describe("reservation.dao — heatmap", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getReservationsHeatmap", () => {
    it("should return array of day/hour/count objects", async () => {
      Reservation.findAll.mockResolvedValue([
        { dayOfWeek: 2, hour: 12, count: "3" },
        { dayOfWeek: 2, hour: 13, count: "2" },
        { dayOfWeek: 5, hour: 19, count: "4" },
      ]);

      const result = await reservationDAO.getReservationsHeatmap();

      expect(result).toEqual([
        { day: "Mon", hour: "12:00", count: 3 },
        { day: "Mon", hour: "13:00", count: 2 },
        { day: "Thu", hour: "19:00", count: 4 },
      ]);
    });
  });

  describe("getHeatmapV2", () => {
    it("should return date-hour matrix with dates, hours, matrix, totals", async () => {
      db.reservation.findAll.mockResolvedValue([
        { date: "2026-06-29", hour: 12, count: "2" },
        { date: "2026-06-29", hour: 13, count: "3" },
        { date: "2026-06-30", hour: 12, count: "1" },
      ]);

      const result = await reservationDAO.getHeatmapV2("2026-06-29", "2026-06-30", "date-hour");

      expect(result.dates).toEqual(["2026-06-29", "2026-06-30"]);
      expect(result.hours).toEqual(["12", "13"]);
      expect(result.matrix).toEqual([[2, 3], [1, 0]]);
      expect(result.totalsPerDay).toEqual([5, 1]);
      expect(result.totalsPerHour).toEqual([3, 3]);
    });

    it("should return calendar mode with days and peak hour", async () => {
      db.reservation.findAll.mockResolvedValue([
        { date: "2026-06-29", count: "5", peakHour: "12", peakCount: "3" },
        { date: "2026-06-30", count: "2", peakHour: "19", peakCount: "2" },
      ]);

      const result = await reservationDAO.getHeatmapV2("2026-06-29", "2026-06-30", "calendar");

      expect(result.days).toHaveLength(2);
      expect(result.days[0]).toEqual({
        date: "2026-06-29",
        count: 5,
        peakHour: "12:00",
        peakCount: 3,
      });
      expect(result.days[1]).toEqual({
        date: "2026-06-30",
        count: 2,
        peakHour: "19:00",
        peakCount: 2,
      });
    });

    it("should return empty arrays when no reservations match", async () => {
      Reservation.findAll.mockResolvedValue([]);

      const result = await reservationDAO.getHeatmapV2("2026-06-29", "2026-06-30", "date-hour");

      expect(result.dates).toEqual([]);
      expect(result.hours).toEqual([]);
      expect(result.matrix).toEqual([]);
      expect(result.totalsPerDay).toEqual([]);
      expect(result.totalsPerHour).toEqual([]);
    });

    it("should filter by date range in date-hour mode", async () => {
      Reservation.findAll.mockResolvedValue([]);

      await reservationDAO.getHeatmapV2("2026-06-01", "2026-06-30", "date-hour");

      const callArgs = Reservation.findAll.mock.calls[0][0];
      expect(callArgs.where.resDate).toEqual({
        [Op.gte]: "2026-06-01",
        [Op.lte]: "2026-06-30",
      });
      expect(callArgs.where.resStatus).toBe("pending");
    });

    it("should filter by date range in calendar mode", async () => {
      Reservation.findAll.mockResolvedValue([]);

      await reservationDAO.getHeatmapV2("2026-06-01", "2026-06-30", "calendar");

      const callArgs = Reservation.findAll.mock.calls[0][0];
      expect(callArgs.where.resDate).toEqual({
        [Op.gte]: "2026-06-01",
        [Op.lte]: "2026-06-30",
      });
      expect(callArgs.where.resStatus).toBe("pending");
    });
  });
});
