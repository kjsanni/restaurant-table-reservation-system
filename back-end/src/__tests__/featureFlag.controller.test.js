const { listFeatureFlagsHandler } = require("../tenant-platform/controllers/featureFlag.controller");

jest.mock("../tenant-platform/services/tenantTypeDefaults.service", () => ({
  FLAG_CATEGORIES: {
    restaurant: {
      label: "Restaurant",
      flags: {
        table_management: { label: "Table Management", description: "Enable table mapping", dependencies: [] },
        waitlist: { label: "Waitlist", description: "Allow digital waitlist", dependencies: [] },
      },
    },
    salon: {
      label: "Salon",
      flags: {
        salon_appointments: { label: "Appointments", description: "Calendar booking", dependencies: [] },
        salon_module_enabled: { label: "Salon Module", description: "Enable salon vertical", dependencies: [] },
      },
    },
    erpnext: {
      label: "ERPNext",
      flags: {
        erpnext_accounting: { label: "Accounting", description: "Ledger sync", dependencies: [] },
      },
    },
  },
  ALL_FEATURE_FLAGS: ["table_management", "waitlist", "salon_appointments", "salon_module_enabled", "erpnext_accounting"],
}));

describe("listFeatureFlagsHandler", () => {
  it("returns all known flags with categories, labels, descriptions, and dependencies", async () => {
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    await listFeatureFlagsHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      flags: [
        { flag: "table_management", category: "Restaurant", label: "Table Management", description: "Enable table mapping", dependencies: [] },
        { flag: "waitlist", category: "Restaurant", label: "Waitlist", description: "Allow digital waitlist", dependencies: [] },
        { flag: "salon_appointments", category: "Salon", label: "Appointments", description: "Calendar booking", dependencies: [] },
        { flag: "salon_module_enabled", category: "Salon", label: "Salon Module", description: "Enable salon vertical", dependencies: [] },
        { flag: "erpnext_accounting", category: "ERPNext", label: "Accounting", description: "Ledger sync", dependencies: [] },
      ],
    });
  });
});
