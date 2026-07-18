const reportService = require("../services/reportService");

jest.mock("../DAOs/reservation.dao");
jest.mock("../services/paymentService");

const reservationDAO = require("../DAOs/reservation.dao");
const paymentService = require("../services/paymentService");

describe("Advanced reporting", () => {
  beforeEach(() => jest.clearAllMocks());

  it("getTimeSeriesReport returns daily reservation counts", async () => {
    reservationDAO.findAllReservationsRaw.mockResolvedValue([
      { resDate: "2026-07-18", people: 2, expectedTotal: 100 },
      { resDate: "2026-07-18", people: 3, expectedTotal: 150 },
      { resDate: "2026-07-19", people: 2, expectedTotal: 120 },
    ]);
    paymentService.getRevenueStats.mockResolvedValue({ totalRevenue: 370 });

    const result = await reportService.getTimeSeriesReport({ from: "2026-07-18", to: "2026-07-19" }, "tenant-1");
    expect(result.timeSeries).toHaveLength(2);
    expect(result.timeSeries[0].reservations).toBe(2);
    expect(result.timeSeries[0].covers).toBe(5);
    expect(result.totalRevenue).toBe(370);
  });

  it("getCustomerAnalytics returns top customers by visits", async () => {
    reservationDAO.findAllReservationsRaw.mockResolvedValue([
      { customerId: 1, name: "Alice", email: "alice@example.com", resDate: "2026-07-18", expectedTotal: 100 },
      { customerId: 1, name: "Alice", email: "alice@example.com", resDate: "2026-07-19", expectedTotal: 120 },
      { customerId: 2, name: "Bob", email: "bob@example.com", resDate: "2026-07-18", expectedTotal: 80 },
    ]);

    const result = await reportService.getCustomerAnalytics({ from: "2026-07-18", to: "2026-07-19" }, "tenant-1");
    expect(result.totalCustomers).toBe(2);
    expect(result.customers[0].name).toBe("Alice");
    expect(result.customers[0].visits).toBe(2);
  });

  it("getTableUtilization returns table summaries", async () => {
    reservationDAO.findAllReservationsRaw.mockResolvedValue([
      { tableId: 1, tableName: "T1", people: 2 },
      { tableId: 1, tableName: "T1", people: 3 },
      { tableId: 2, tableName: "T2", people: 4 },
    ]);

    const result = await reportService.getTableUtilization({ from: "2026-07-18", to: "2026-07-19" }, "tenant-1");
    expect(result.totalTables).toBe(2);
    const t1 = result.tables.find((t) => t.tableId === 1);
    expect(t1.reservations).toBe(2);
    expect(t1.avgPartySize).toBe(3);
  });

  it("getNoShowAnalytics returns no-show patterns", async () => {
    reservationDAO.findAllReservationsRaw.mockResolvedValue([
      { resDate: "2026-07-18", resTime: "19:00" },
      { resDate: "2026-07-18", resTime: "20:00" },
      { resDate: "2026-07-19", resTime: "19:00" },
    ]);

    const result = await reportService.getNoShowAnalytics({ from: "2026-07-18", to: "2026-07-19" }, "tenant-1");
    expect(result.total).toBe(3);
    expect(result.byDay).toHaveLength(2);
    expect(result.byTime).toHaveLength(2);
  });
});
