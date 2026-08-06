"use strict";
const pricingRuleDao = require("../DAOs/pricingRule.dao");
const { createCrudHandlers } = require("./base.controller");

const pricingRuleHandlers = createCrudHandlers(pricingRuleDao, "PricingRule", {
  displayName: "Pricing rule",
});

module.exports = {
  ...pricingRuleHandlers,
};
