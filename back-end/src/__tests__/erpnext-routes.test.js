describe("ERPNext integration route loading", () => {
  it("loads accounting proxy routes without throwing", () => {
    expect(() => {
      require("../integrations/erpnext/proxies/accounting.proxy");
    }).not.toThrow();
  });

  it("loads HR proxy routes without throwing", () => {
    expect(() => {
      require("../integrations/erpnext/proxies/hr.proxy");
    }).not.toThrow();
  });

  it("loads inventory proxy routes without throwing", () => {
    expect(() => {
      require("../integrations/erpnext/proxies/inventory.proxy");
    }).not.toThrow();
  });

  it("loads CRM proxy routes without throwing", () => {
    expect(() => {
      require("../integrations/erpnext/proxies/crm.proxy");
    }).not.toThrow();
  });

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
});
