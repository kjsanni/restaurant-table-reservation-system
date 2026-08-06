"use strict";

jest.mock("../verticals/salon/DAOs/marketingCampaign.dao");
jest.mock("../middleware/auditLog", () => ({ logAction: jest.fn() }));

const marketingCampaignController = require("../verticals/salon/controllers/marketing-campaign.controller");
const { makeRes } = require("./utils/test-response");

describe("marketingCampaign.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getMarketingCampaigns returns data for tenant", async () => {
    require("../verticals/salon/DAOs/marketingCampaign.dao").findAllForTenant.mockResolvedValue({
      total: 1,
      data: [{ id: 1, name: "Summer", status: "draft" }],
    });

    const ref = makeRes();
    const req = { tenant: { id: 1 }, query: {} };

    await marketingCampaignController.getMarketingCampaignsHandler(req, ref.res);

    expect(require("../verticals/salon/DAOs/marketingCampaign.dao").findAllForTenant).toHaveBeenCalledWith(1, {});
    ref.expectJson({
      success: true,
      total: 1,
      data: [{ id: 1, name: "Summer", status: "draft" }],
    });
  });

  it("createMarketingCampaign returns 201", async () => {
    require("../verticals/salon/DAOs/marketingCampaign.dao").create.mockResolvedValue({
      id: 1,
      name: "Summer",
      status: "draft",
    });

    const ref = makeRes();
    const req = {
      tenant: { id: 1 },
      body: { name: "Summer", status: "draft" },
    };

    await marketingCampaignController.createMarketingCampaignHandler(req, ref.res);

    expect(ref.res.status).toHaveBeenCalledWith(201);
    ref.expectJson({
      success: true,
      campaign: { id: 1, name: "Summer", status: "draft" },
    });
  });

  it("updateMarketingCampaign returns 404 when DAO returns null", async () => {
    require("../verticals/salon/DAOs/marketingCampaign.dao").update.mockResolvedValue(null);

    const ref = makeRes();
    const req = { tenant: { id: 1 }, params: { id: 999 }, body: { status: "sent" } };

    await marketingCampaignController.updateMarketingCampaignHandler(req, ref.res);

    expect(ref.res.status).toHaveBeenCalledWith(404);
    ref.expectJson({ success: false, message: "Campaign not found" });
  });

  it("deleteMarketingCampaign returns 404 when DAO returns false", async () => {
    require("../verticals/salon/DAOs/marketingCampaign.dao").delete.mockResolvedValue(false);

    const ref = makeRes();
    const req = { tenant: { id: 1 }, params: { id: 999 } };

    await marketingCampaignController.deleteMarketingCampaignHandler(req, ref.res);

    expect(ref.res.status).toHaveBeenCalledWith(404);
    ref.expectJson({ success: false, message: "Campaign not found" });
  });
});
