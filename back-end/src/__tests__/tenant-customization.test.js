jest.mock("../db/models", () => {
  const mockTenant = {
    id: 1,
    name: "Test Tenant",
    slug: "test-tenant",
    domain: null,
    settings: {},
    update: jest.fn().mockResolvedValue(true),
  };

  return {
    tenant: {
      findByPk: jest.fn().mockResolvedValue(mockTenant),
    },
  };
});

const TenantCustomization = require("../tenant-platform/services/tenant-customization.service");

describe("Tenant Customization Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns empty theme settings for tenant with no theme", async () => {
    const theme = await TenantCustomization.getThemeSettings(1);
    expect(theme).toEqual({});
  });

  it("sets theme settings for tenant", async () => {
    const theme = await TenantCustomization.setThemeSettings(1, { primaryColor: "#ff0000" });
    expect(theme).toEqual({ primaryColor: "#ff0000" });
  });

  it("returns default locale settings", async () => {
    const locale = await TenantCustomization.getLocaleSettings(1);
    expect(locale.language).toBe("en");
    expect(locale.strings).toEqual({});
  });

  it("sets locale strings for tenant", async () => {
    const locale = await TenantCustomization.setLocaleStrings(1, { welcome: "Welcome" });
    expect(locale.strings).toEqual({ welcome: "Welcome" });
  });

  it("returns null domain for tenant with no custom domain", async () => {
    const domain = await TenantCustomization.getCustomDomain(1);
    expect(domain.domain).toBeNull();
  });

  it("sets custom domain for tenant", async () => {
    const result = await TenantCustomization.setCustomDomain(1, "example.com");
    expect(result.domain).toBe("example.com");
  });
});
