describe("ERPNext integration route loading", () => {
  const proxyModules = [
    { name: "accounting", path: "../integrations/erpnext/proxies/accounting.proxy" },
    { name: "HR", path: "../integrations/erpnext/proxies/hr.proxy" },
    { name: "inventory", path: "../integrations/erpnext/proxies/inventory.proxy" },
    { name: "CRM", path: "../integrations/erpnext/proxies/crm.proxy" },
  ];

  for (const mod of proxyModules) {
    it(`loads ${mod.name} proxy routes without throwing`, () => {
      expect(() => {
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
      expect.arrayContaining(["/customers", "/leads", "/campaigns", "/opportunities"])
    );
  });
});
