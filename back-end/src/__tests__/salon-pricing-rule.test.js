"use strict";

jest.mock("../verticals/salon/DAOs/pricingRule.dao");
jest.mock("../middleware/auditLog", () => ({ logAction: jest.fn() }));

const pricingRuleController = require("../verticals/salon/controllers/pricingRule.controller");
const { makeRes } = require("./utils/test-response");

describe("pricingRule.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getPricingRules returns data for tenant", async () => {
    require("../verticals/salon/DAOs/pricingRule.dao").findAll.mockResolvedValue([
      { id: 1, name: "Early Bird", ruleType: "percentage_discount", value: 10 },
    ]);

    const ref = makeRes();
    const req = { tenant: { id: 1 }, query: {} };

    await pricingRuleController.getPricingRulesHandler(req, ref.res);

    expect(require("../verticals/salon/DAOs/pricingRule.dao").findAll).toHaveBeenCalledWith(1, {});
    ref.expectJson({
      success: true,
      data: [{ id: 1, name: "Early Bird", ruleType: "percentage_discount", value: 10 }],
    });
  });

  it("createPricingRule returns 201", async () => {
    require("../verticals/salon/DAOs/pricingRule.dao").create.mockResolvedValue({
      id: 1,
      name: "Early Bird",
      ruleType: "percentage_discount",
      value: 10,
    });

    const ref = makeRes();
    const req = {
      tenant: { id: 1 },
      body: { name: "Early Bird", ruleType: "percentage_discount", value: 10, currency: "GHS", isActive: true },
    };

    await pricingRuleController.createPricingRuleHandler(req, ref.res);

    expect(ref.res.status).toHaveBeenCalledWith(201);
    ref.expectJson({
      success: true,
      data: { id: 1, name: "Early Bird", ruleType: "percentage_discount", value: 10 },
    });
  });

  it("getPricingRule returns 404 when not found", async () => {
    require("../verticals/salon/DAOs/pricingRule.dao").findById.mockResolvedValue(null);

    const ref = makeRes();
    const req = { tenant: { id: 1 }, params: { id: 999 } };

    await pricingRuleController.getPricingRuleHandler(req, ref.res);

    expect(ref.res.status).toHaveBeenCalledWith(404);
    ref.expectJson({ success: false, message: "Pricing rule not found" });
  });

  it("updatePricingRule returns 404 when DAO returns null", async () => {
    require("../verticals/salon/DAOs/pricingRule.dao").update.mockResolvedValue(null);

    const ref = makeRes();
    const req = { tenant: { id: 1 }, params: { id: 999 }, body: { value: 20 } };

    await pricingRuleController.updatePricingRuleHandler(req, ref.res);

    expect(ref.res.status).toHaveBeenCalledWith(404);
    ref.expectJson({ success: false, message: "Pricing rule not found" });
  });

  it("deletePricingRule returns 404 when DAO returns false", async () => {
    require("../verticals/salon/DAOs/pricingRule.dao").delete.mockResolvedValue(false);

    const ref = makeRes();
    const req = { tenant: { id: 1 }, params: { id: 999 } };

    await pricingRuleController.deletePricingRuleHandler(req, ref.res);

    expect(ref.res.status).toHaveBeenCalledWith(404);
    ref.expectJson({ success: false, message: "Pricing rule not found" });
  });
});
