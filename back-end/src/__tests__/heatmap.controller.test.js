jest.mock("../DAOs/reservation.dao", () => ({
  getHeatmapV2: jest.fn(),
}));

const reservationDAO = require("../DAOs/reservation.dao");
const reservationController = require("../controllers/reservation.controller");

describe("reservation.controller — heatmap-v2", () => {
  let req;
  let res;

  beforeEach(() => {
    req = { query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it("should return 400 for invalid mode", async () => {
    req.query.mode = "invalid-mode";

    await reservationController.getHeatmapV2Handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid mode. Use 'date-hour' or 'calendar'.",
    });
    expect(reservationDAO.getHeatmapV2).not.toHaveBeenCalled();
  });

  it("should return 400 for invalid from date", async () => {
    req.query.from = "not-a-date";
    req.query.mode = "date-hour";

    await reservationController.getHeatmapV2Handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid 'from' date. Use YYYY-MM-DD format.",
    });
    expect(reservationDAO.getHeatmapV2).not.toHaveBeenCalled();
  });

  it("should return 400 for invalid to date", async () => {
    req.query.to = "not-a-date";
    req.query.mode = "date-hour";

    await reservationController.getHeatmapV2Handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid 'to' date. Use YYYY-MM-DD format.",
    });
    expect(reservationDAO.getHeatmapV2).not.toHaveBeenCalled();
  });

  it("should return 400 when from > to", async () => {
    req.query.from = "2026-06-30";
    req.query.to = "2026-06-01";
    req.query.mode = "date-hour";

    await reservationController.getHeatmapV2Handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "'from' date cannot be after 'to' date.",
    });
    expect(reservationDAO.getHeatmapV2).not.toHaveBeenCalled();
  });

  it("should return 200 with heatmap data for valid date-hour request", async () => {
    req.query.mode = "date-hour";
    req.query.from = "2026-06-01";
    req.query.to = "2026-06-30";
    reservationDAO.getHeatmapV2.mockResolvedValue({
      dates: ["2026-06-01"],
      hours: ["12"],
      matrix: [[5]],
      totalsPerDay: [5],
      totalsPerHour: [5],
    });

    await reservationController.getHeatmapV2Handler(req, res);

    expect(reservationDAO.getHeatmapV2).toHaveBeenCalledWith("2026-06-01", "2026-06-30", "date-hour", undefined);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      dates: ["2026-06-01"],
      hours: ["12"],
      matrix: [[5]],
      totalsPerDay: [5],
      totalsPerHour: [5],
    });
  });

  it("should return 200 with heatmap data for valid calendar request", async () => {
    req.query.mode = "calendar";
    req.query.from = "2026-06-01";
    req.query.to = "2026-06-30";
    reservationDAO.getHeatmapV2.mockResolvedValue({
      days: [{ date: "2026-06-01", count: 3, peakHour: "12:00", peakCount: 3 }],
    });

    await reservationController.getHeatmapV2Handler(req, res);

    expect(reservationDAO.getHeatmapV2).toHaveBeenCalledWith("2026-06-01", "2026-06-30", "calendar", undefined);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      days: [{ date: "2026-06-01", count: 3, peakHour: "12:00", peakCount: 3 }],
    });
  });

  it("should default mode to date-hour when not provided", async () => {
    req.query.from = "2026-06-01";
    req.query.to = "2026-06-30";
    reservationDAO.getHeatmapV2.mockResolvedValue({
      dates: [],
      hours: [],
      matrix: [],
      totalsPerDay: [],
      totalsPerHour: [],
    });

    await reservationController.getHeatmapV2Handler(req, res);

    expect(reservationDAO.getHeatmapV2).toHaveBeenCalledWith("2026-06-01", "2026-06-30", "date-hour", undefined);
  });

  it("should accept from-only without to", async () => {
    req.query.from = "2026-06-01";
    req.query.mode = "date-hour";
    reservationDAO.getHeatmapV2.mockResolvedValue({
      dates: [],
      hours: [],
      matrix: [],
      totalsPerDay: [],
      totalsPerHour: [],
    });

    await reservationController.getHeatmapV2Handler(req, res);

    expect(reservationDAO.getHeatmapV2).toHaveBeenCalledWith("2026-06-01", undefined, "date-hour", undefined);
  });

  it("should accept to-only without from", async () => {
    req.query.to = "2026-06-30";
    req.query.mode = "date-hour";
    reservationDAO.getHeatmapV2.mockResolvedValue({
      dates: [],
      hours: [],
      matrix: [],
      totalsPerDay: [],
      totalsPerHour: [],
    });

    await reservationController.getHeatmapV2Handler(req, res);

    expect(reservationDAO.getHeatmapV2).toHaveBeenCalledWith(undefined, "2026-06-30", "date-hour", undefined);
  });
});
