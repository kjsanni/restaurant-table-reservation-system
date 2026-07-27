const verticalAnalyticsController = require("../tenant-platform/controllers/verticalAnalytics.controller");

jest.mock("../db/models");

describe("verticalAnalytics.controller", () => {
  let req;
  let res;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it("getVerticalAnalyticsHandler returns comparison", async () => {
    const db = require("../db/models");
    db.tenant.findAll = jest.fn().mockResolvedValue([]);
    db.tenant.count = jest.fn().mockResolvedValue(0);
    db.reservation.count = jest.fn().mockResolvedValue(0);
    db.customer.count = jest.fn().mockResolvedValue(0);

    await verticalAnalyticsController.getVerticalAnalyticsHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});
