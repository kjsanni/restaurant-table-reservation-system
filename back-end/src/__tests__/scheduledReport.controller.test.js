const scheduledReportController = require("../controllers/scheduledReport.controller");
const scheduledReportDAO = require("../DAOs/scheduledReport.dao");

jest.mock("../DAOs/scheduledReport.dao");

describe("scheduledReport.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const buildReq = (overrides = {}) => ({
    tenant: { id: 1 },
    user: { id: 10 },
    params: {},
    body: {},
    ...overrides,
  });

  it("lists scheduled reports for tenant", async () => {
    scheduledReportDAO.list.mockResolvedValue([{ id: 1, name: "Weekly Revenue" }]);
    const req = buildReq();
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

    await scheduledReportController.listScheduledReportsHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, collection: [{ id: 1, name: "Weekly Revenue" }] });
    expect(scheduledReportDAO.list).toHaveBeenCalledWith({ tenantId: 1 });
  });

  it("creates a scheduled report", async () => {
    scheduledReportDAO.create.mockResolvedValue({ id: 1, name: "Weekly Revenue", frequency: "weekly" });
    const req = buildReq({
      body: {
        name: "Weekly Revenue",
        reportType: "salon_revenue",
        frequency: "weekly",
        frequencyTime: "08:00",
        recipients: ["admin@example.com"],
      },
    });
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

    await scheduledReportController.createScheduledReportHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(scheduledReportDAO.create).toHaveBeenCalledWith({
      tenantId: 1,
      name: "Weekly Revenue",
      reportType: "salon_revenue",
      format: "csv",
      filters: null,
      frequency: "weekly",
      frequencyDay: null,
      frequencyTime: "08:00",
      recipients: ["admin@example.com"],
      enabled: true,
      nextRunAt: expect.any(Date),
      createdBy: 10,
    });
  });

  it("updates a scheduled report", async () => {
    scheduledReportDAO.findById.mockResolvedValue({ id: 1, tenantId: 1, frequency: "weekly" });
    scheduledReportDAO.update.mockResolvedValue({ id: 1, name: "Updated" });
    const req = buildReq({
      params: { id: "1" },
      body: { name: "Updated", frequency: "daily", frequencyTime: "09:00" },
    });
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

    await scheduledReportController.updateScheduledReportHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(scheduledReportDAO.update).toHaveBeenCalledWith("1", expect.objectContaining({ name: "Updated" }));
  });

  it("deletes a scheduled report", async () => {
    scheduledReportDAO.remove.mockResolvedValue({ id: 1 });
    const req = buildReq({ params: { id: "1" } });
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

    await scheduledReportController.deleteScheduledReportHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(scheduledReportDAO.remove).toHaveBeenCalledWith("1", 1);
  });
});
