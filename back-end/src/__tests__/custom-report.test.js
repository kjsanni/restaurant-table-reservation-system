const customReportController = require("../controllers/custom-report.controller");

jest.mock("../services/customReport.service");

const customReportService = require("../services/customReport.service");

describe("Custom report", () => {
  beforeEach(() => jest.clearAllMocks());

  it("getReportSourcesHandler returns available sources", async () => {
    const req = { tenant: { id: 1 } };
    const res = { status: jest.fn(() => res), json: jest.fn() };
    customReportService.getAvailableSources.mockReturnValue([
      { key: "reservations", label: "Reservations" },
    ]);

    await customReportController.getReportSourcesHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, sources: [{ key: "reservations", label: "Reservations" }] });
  });

  it("runCustomReportHandler builds report for reservations", async () => {
    const req = {
      tenant: { id: 1 },
      body: { source: "reservations", fields: ["id", "resDate"], filters: {} },
    };
    const res = { status: jest.fn(() => res), json: jest.fn() };
    customReportService.buildCustomReport.mockResolvedValue({ data: [], total: 0 });

    await customReportController.runCustomReportHandler(req, res);
    expect(customReportService.buildCustomReport).toHaveBeenCalledWith(req.body, 1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("runCustomReportHandler rejects missing source", async () => {
    const req = { tenant: { id: 1 }, body: {} };
    const res = { status: jest.fn(() => res), json: jest.fn() };

    await customReportController.runCustomReportHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Report source is required" });
  });

  it("exportCustomReportCSVHandler returns CSV", async () => {
    const req = {
      tenant: { id: 1 },
      body: { source: "reservations", fields: ["id"], filters: {} },
    };
    const res = {
      status: jest.fn(() => res),
      json: jest.fn(),
      setHeader: jest.fn(),
      send: jest.fn(),
    };

    customReportService.buildCustomReport.mockResolvedValue({ data: [{ id: 1 }], total: 1 });

    await customReportController.exportCustomReportCSVHandler(req, res);
    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "text/csv");
    expect(res.send).toHaveBeenCalled();
  });

  it("exportCustomReportCSVHandler rejects empty data", async () => {
    const req = {
      tenant: { id: 1 },
      body: { source: "reservations", fields: ["id"], filters: {} },
    };
    const res = { status: jest.fn(() => res), json: jest.fn() };
    customReportService.buildCustomReport.mockResolvedValue({ data: [], total: 0 });

    await customReportController.exportCustomReportCSVHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
