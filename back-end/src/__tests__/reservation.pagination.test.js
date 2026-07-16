const { Sequelize } = require("sequelize");

jest.mock("../db/models", () => {
  const SequelizeLib = require("sequelize");
  const mockFindAndCountAll = jest.fn();
  const MockReservation = {
    findAndCountAll: mockFindAndCountAll,
  };
  return {
    Sequelize: SequelizeLib,
    reservation: MockReservation,
    customer: {},
    table: {},
    sequelize: {
      fn: jest.fn(),
      col: jest.fn(),
      Op: SequelizeLib.Op,
    },
  };
});

const db = require("../db/models");
const { Op } = db.Sequelize;
const { fn, col } = db.sequelize;
const Reservation = db.reservation;
const reservationDAO = require("../DAOs/reservation.dao");

describe("reservation.dao — pagination", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("findAllReservations should paginate when limit is provided", async () => {
    const mockRows = [{ id: 1, toJSON: () => ({ id: 1 }) }, { id: 2, toJSON: () => ({ id: 2 }) }];
    Reservation.findAndCountAll.mockResolvedValue({
      rows: mockRows,
      count: 10,
    });

    const result = await reservationDAO.findAllReservations({ limit: 2, offset: 0 });

    expect(Reservation.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 2,
        offset: 0,
      })
    );
    expect(result.reservations).toHaveLength(2);
    expect(result.total).toBe(10);
  });

  it("findAllReservations should return all when no pagination", async () => {
    const mockRows = [{ id: 1, toJSON: () => ({ id: 1 }) }, { id: 2, toJSON: () => ({ id: 2 }) }, { id: 3, toJSON: () => ({ id: 3 }) }];
    Reservation.findAndCountAll.mockResolvedValue({
      rows: mockRows,
      count: 3,
    });

    const result = await reservationDAO.findAllReservations();

    const callArgs = Reservation.findAndCountAll.mock.calls[0][0];
    expect(callArgs.limit).toBeUndefined();
    expect(callArgs.offset).toBeUndefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(3);
  });
});
