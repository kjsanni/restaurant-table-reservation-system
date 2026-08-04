describe("ERPNext integration route loading", () => {
  const originalSecret = process.env.JWT_SECRET;
  beforeAll(() => {
    process.env.JWT_SECRET = "test-secret-test-secret-test-secret";
  });
  afterAll(() => {
    if (originalSecret) {
      process.env.JWT_SECRET = originalSecret;
    } else {
      delete process.env.JWT_SECRET;
    }
  });

  const proxyModules = [
    { name: "accounting", path: "../integrations/erpnext/proxies/accounting.proxy" },
    { name: "HR", path: "../integrations/erpnext/proxies/hr.proxy" },
    { name: "inventory", path: "../integrations/erpnext/proxies/inventory.proxy" },
    { name: "CRM", path: "../integrations/erpnext/proxies/crm.proxy" },
  ];

  for (const mod of proxyModules) {
    it(`loads ${mod.name} proxy routes without throwing`, () => {
      expect(() => {
        // codacy:ignore-next-line - proxyModules paths are hardcoded string literals from the array above, not user input
        require(mod.path);
      }).not.toThrow();
    });
  }

  it("loads onboarding routes without throwing", () => {
    expect(() => {
      require("../integrations/erpnext/onboarding/onboarding");
    }).not.toThrow();
  });

  it("loads admin routes without throwing", () => {
    expect(() => {
      require("../integrations/erpnext/admin/admin.router");
    }).not.toThrow();
  });

  it("loads ERPNext client without throwing", () => {
    expect(() => {
      require("../integrations/erpnext/client");
    }).not.toThrow();
  });

  it("CRM proxy exposes routes matching frontend erpnextAPI CRM methods", () => {
    const crm = require("../integrations/erpnext/proxies/crm.proxy");
    const layerPaths = crm.stack
      .filter((l) => l.route)
      .map((l) => l.route.path);

    expect(layerPaths).toEqual(
      expect.arrayContaining(["/crm/customers", "/crm/leads", "/crm/campaigns", "/crm/opportunities"])
    );
  });

  it("HR proxy exposes routes matching frontend erpnextAPI HR methods", () => {
    const hr = require("../integrations/erpnext/proxies/hr.proxy");
    const layerPaths = hr.stack
      .filter((l) => l.route)
      .map((l) => l.route.path);

    expect(layerPaths).toEqual(
      expect.arrayContaining(["/hr/employees", "/hr/employees/attendance", "/hr/employees/payroll", "/hr/sync/employees"])
    );
  });

  it("Inventory proxy exposes routes matching frontend erpnextAPI inventory methods", () => {
    const inventory = require("../integrations/erpnext/proxies/inventory.proxy");
    const layerPaths = inventory.stack
      .filter((l) => l.route)
      .map((l) => l.route.path);

    expect(layerPaths).toEqual(
      expect.arrayContaining(["/inventory/items", "/inventory/stock", "/inventory/warehouses", "/inventory/sync/items"])
    );
  });

  it("Manufacturing proxy exposes routes matching frontend erpnextAPI manufacturing methods", () => {
    const manufacturing = require("../integrations/erpnext/proxies/manufacturing.proxy");
    const layerPaths = manufacturing.stack
      .filter((l) => l.route)
      .map((l) => l.route.path);

    expect(layerPaths).toEqual(
      expect.arrayContaining(["/manufacturing/boms", "/manufacturing/production-plans"])
    );
  });
});
