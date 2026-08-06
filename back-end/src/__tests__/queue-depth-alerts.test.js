const { getQueueDepth, QUEUE_DEPTH_THRESHOLDS } = require("../queues/queue");

describe("BullMQ queue depth alerts", () => {
  let mockQueue;

  beforeEach(() => {
    jest.clearAllMocks();
    mockQueue = {
      name: "test-queue",
      getWaitingCount: jest.fn(),
      getActiveCount: jest.fn(),
      getDelayedCount: jest.fn(),
      getFailedCount: jest.fn(),
    };
  });

  it("getQueueDepth returns total jobs across all states", async () => {
    mockQueue.getWaitingCount.mockResolvedValue(10);
    mockQueue.getActiveCount.mockResolvedValue(5);
    mockQueue.getDelayedCount.mockResolvedValue(3);
    mockQueue.getFailedCount.mockResolvedValue(2);

    const depth = await getQueueDepth(mockQueue);
    expect(depth).toBe(20);
  });

  it("getQueueDepth returns 0 when queue is null", async () => {
    const depth = await getQueueDepth(null);
    expect(depth).toBe(0);
  });

  it("getQueueDepth returns 0 when queue throws", async () => {
    mockQueue.getWaitingCount.mockRejectedValue(new Error("Redis down"));
    const depth = await getQueueDepth(mockQueue);
    expect(depth).toBe(0);
  });

  it("QUEUE_DEPTH_THRESHOLDS has sensible defaults for known queues", () => {
    expect(QUEUE_DEPTH_THRESHOLDS).toHaveProperty("notifications");
    expect(QUEUE_DEPTH_THRESHOLDS).toHaveProperty("reports");
    expect(QUEUE_DEPTH_THRESHOLDS).toHaveProperty("backups");
    expect(QUEUE_DEPTH_THRESHOLDS).toHaveProperty("erpnext-sync");
  });

  it("QUEUE_DEPTH_THRESHOLDS values are positive integers", () => {
    Object.values(QUEUE_DEPTH_THRESHOLDS).forEach((threshold) => {
      expect(Number.isInteger(threshold)).toBe(true);
      expect(threshold).toBeGreaterThan(0);
    });
  });
});
