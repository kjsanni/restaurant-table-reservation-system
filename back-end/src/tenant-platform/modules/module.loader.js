"use strict";

const { ModuleRegistry } = require("./module.registry");
const { tenantPlatformModule } = require("./tenant-platform.module");
const { restaurantModule } = require("../../verticals/restaurant/modules/restaurant.module");
const { salonModule } = require("../../verticals/salon/modules/salon.module");

const registry = new ModuleRegistry();

registry.register(tenantPlatformModule);
registry.register(restaurantModule);
registry.register(salonModule);

const violations = registry.verifyIntegrity();
if (violations.length > 0) {
  console.warn("[ModuleRegistry] Integrity violations detected:", JSON.stringify(violations, null, 2));
}

module.exports = { registry, loadModules: (app) => registry.load(app) };
