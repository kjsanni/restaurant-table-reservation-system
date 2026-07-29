const { reportQueue, safeAdd } = require("../queues/queue");

jest.mock("../queues/queue", () => ({
  ...jest.requireActual("../queues/queue"),
  reportQueue: {
    add: jest.fn(),
    close: jest.fn(() => Promise.resolve()),
  },
}));

describe("BullMQ tenant data isolation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    reportQueue.add.mockResolvedValue({ id: "job-1" });
  });

  it("safeAdd includes tenantId in report job data", async () => {
    await safeAdd(reportQueue, "csv", { type: "csv", filters: {}, tenantId: 10 });

    expect(reportQueue.add).toHaveBeenCalledWith(
      "csv",
      { type: "csv", filters: {}, tenantId: 10 },
      expect.any(Object)
    );
  });

  it("safeAdd returns enqueued true with jobId when queue is available", async () => {
    const result = await safeAdd(reportQueue, "csv", { type: "csv", filters: {}, tenantId: 10 });

    expect(result).toEqual({ enqueued: true, jobId: "job-1" });
  });

  it("safeAdd returns enqueued false when queue is missing", async () => {
    const result = await safeAdd(null, "csv", { type: "csv", filters: {}, tenantId: 10 });

    expect(result).toEqual({ enqueued: false });
  });

  it("safeAdd returns enqueued false when add throws", async () => {
    reportQueue.add.mockRejectedValue(new Error("Redis down"));

    const result = await safeAdd(reportQueue, "csv", { type: "csv", filters: {}, tenantId: 10 });

    expect(result).toEqual({ enqueued: false });
  });

  it("different tenants get separate job data payloads", async () => {
    await safeAdd(reportQueue, "csv", { type: "csv", filters: {}, tenantId: 1 });
    await safeAdd(reportQueue, "csv", { type: "csv", filters: {}, tenantId: 2 });

    const calls = reportQueue.add.mock.calls;
    expect(calls[0][1].tenantId).toBe(1);
    expect(calls[1][1].tenantId).toBe(2);
  });
});
