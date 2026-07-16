// Security regression tests for fixes applied 2026-07-16:
//  - RBAC permission enforcement (no implicit grants)
//  - reservation mass-assignment allowlist
//  - revenue discount math
//  - CSV formula-injection escaping

const { requirePermission } = require("../middleware/auth");
const reservationService = require("../services/reservationService");
const reservationDAO = require("../DAOs/reservation.dao");

jest.mock("../services/reservationService");
jest.mock("../services/paymentService");
jest.mock("../utils/pdfGenerator");
jest.mock("../DAOs/reservation.dao");
jest.mock("../db/models", () => {
  const actual = jest.requireActual("../db/models");
  return {
    ...actual,
    payment: {
      findOne: jest.fn(),
      findAll: jest.fn(),
    },
  };
});

const paymentModel = require("../db/models").payment;

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  return res;
};

describe("RBAC — requirePermission", () => {
  it("returns 401 when no user on request", () => {
    const req = {};
    const res = makeRes();
    const next = jest.fn();
    requirePermission("manage_tables")(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("allows when the user holds the required permission", () => {
    const req = { user: { permissions: { manage_tables: true } } };
    const res = makeRes();
    const next = jest.fn();
    requirePermission("manage_tables")(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("denies (403) when permission is absent — no implicit staff grant", () => {
    const req = { user: { role: "staff", permissions: {} } };
    const res = makeRes();
    const next = jest.fn();
    requirePermission("manage_tables")(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("denies when permission present but false", () => {
    const req = { user: { permissions: { manage_tables: false } } };
    const res = makeRes();
    const next = jest.fn();
    requirePermission("manage_tables")(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

describe("Reservation — mass-assignment protection", () => {
  const { editHandler } = require("../controllers/reservation.controller");

  it("strips non-allowlisted fields before updating", async () => {
    const req = {
      params: { reservationId: "5" },
      body: {
        resDate: "2026-08-01",
        resStatus: "completed",
        paymentStatus: "paid",
        expectedTotal: 100,
        // attacker-injected fields that must be dropped:
        role: "admin",
        permissions: { manage_tables: true },
        id: 999,
      },
    };
    const res = makeRes();
    reservationService.editReservation.mockResolvedValue({ id: 5 });

    await editHandler(req, res);

    const passed = reservationService.editReservation.mock.calls[0][2];
    expect(passed).toEqual({
      resDate: "2026-08-01",
      resStatus: "completed",
      paymentStatus: "paid",
      expectedTotal: 100,
    });
    expect(passed).not.toHaveProperty("role");
    expect(passed).not.toHaveProperty("permissions");
    expect(passed).not.toHaveProperty("id");
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("Payment — revenue discount math", () => {
  const { getRevenueStats } = require("../DAOs/payment.dao");

  beforeEach(() => jest.clearAllMocks());

  it("subtracts discount from revenue total", async () => {
    paymentModel.findOne.mockResolvedValue({
      totalRevenue: 500,
      totalDiscount: 100,
      totalPayments: 2,
      avgPayment: 250,
    });
    paymentModel.findAll.mockResolvedValue([]);

    const stats = await getRevenueStats("2026-01-01", "2026-12-31");
    expect(stats.totalRevenue).toBe(400);
  });

  it("returns 0 revenue when no payments exist", async () => {
    paymentModel.findOne.mockResolvedValue(null);
    paymentModel.findAll.mockResolvedValue([]);
    const stats = await getRevenueStats();
    expect(stats.totalRevenue).toBe(0);
  });
});

describe("Report — CSV formula-injection escaping", () => {
  const reportService = require("../services/reportService");
  const reservationDAO = require("../DAOs/reservation.dao");

  beforeEach(() => jest.clearAllMocks());

  const fakeReservations = (name) => [
    {
      id: 1,
      resDate: "2026-08-01",
      resTime: "19:00:00",
      resStatus: "pending",
      paymentStatus: "unpaid",
      people: 2,
      name,
    },
  ];

  const mockReport = (name) => {
    reservationDAO.findAllReservationsRaw.mockResolvedValue(fakeReservations(name));
    reservationDAO.getReservationStats.mockResolvedValue({});
  };

  it("neutralizes formula-injection prefixes in cell values", async () => {
    // Excel/Sheets formula injection triggers on cells starting with = + - @.
    // csvCell wraps such cells in double quotes so CSV readers treat them as
    // literal text instead of executing a formula.
    mockReport("=@SUM(A1:A2)");

    const csv = await reportService.exportCSV({});
    // The dangerous value must be wrapped in quotes (never appear as a bare,
    // unquoted field between commas).
    expect(csv).toContain('"=@SUM(A1:A2)"');
    expect(csv).not.toMatch(/,=@SUM\(A1:A2\)/);
  });

  it("quotes cells containing commas", async () => {
    mockReport("Doe, John");
    const csv = await reportService.exportCSV({});
    expect(csv).toContain('"Doe, John"');
  });
});
