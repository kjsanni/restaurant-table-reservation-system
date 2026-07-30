jest.mock("../db/models", () => ({
  payment: {
    findOne: jest.fn(),
  },
  Sequelize: {
    Op: {},
    fn: jest.fn(),
    col: jest.fn(),
  },
}));

const db = require("../db/models");
const paymentDAO = require("../DAOs/payment.dao");

describe("paymentDAO.updateSplits", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("passes when split total equals payment amount exactly", async () => {
    db.payment.findOne.mockResolvedValue({ id: 1, reservationId: 1, amount: "100.00", update: jest.fn().mockResolvedValue(true) });

    const result = await paymentDAO.updateSplits(1, 1, [{ amount: "50.00" }, { amount: "50.00" }], 1);

    expect(result).not.toBeNull();
  });

  it("passes when split total is within 0.01 tolerance above payment amount", async () => {
    db.payment.findOne.mockResolvedValue({ id: 1, reservationId: 1, amount: "100.00", update: jest.fn().mockResolvedValue(true) });

    const result = await paymentDAO.updateSplits(1, 1, [{ amount: "50.01" }, { amount: "49.99" }], 1);

    expect(result).not.toBeNull();
  });

  it("passes when split total is within 0.01 tolerance below payment amount", async () => {
    db.payment.findOne.mockResolvedValue({ id: 1, reservationId: 1, amount: "100.00", update: jest.fn().mockResolvedValue(true) });

    const result = await paymentDAO.updateSplits(1, 1, [{ amount: "50.00" }, { amount: "49.99" }], 1);

    expect(result).not.toBeNull();
  });

  it("fails when split total exceeds payment amount by 0.02", async () => {
    db.payment.findOne.mockResolvedValue({ id: 1, reservationId: 1, amount: "100.00", update: jest.fn().mockResolvedValue(true) });

    await expect(paymentDAO.updateSplits(1, 1, [{ amount: "50.01" }, { amount: "50.02" }], 1)).rejects.toEqual({
      status: 400,
      message: "Split amounts must sum to the payment amount (100.00).",
    });
  });

  it("fails when split total is below payment amount by 0.02", async () => {
    db.payment.findOne.mockResolvedValue({ id: 1, reservationId: 1, amount: "100.00", update: jest.fn().mockResolvedValue(true) });

    await expect(paymentDAO.updateSplits(1, 1, [{ amount: "49.99" }, { amount: "49.99" }], 1)).rejects.toEqual({
      status: 400,
      message: "Split amounts must sum to the payment amount (100.00).",
    });
  });

  it("returns null when payment record does not exist", async () => {
    db.payment.findOne.mockResolvedValue(null);

    const result = await paymentDAO.updateSplits(1, 1, [{ amount: "50.00" }, { amount: "50.00" }], 1);

    expect(result).toBeNull();
  });
});
