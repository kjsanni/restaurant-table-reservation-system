const { applyTypeDefaults, TYPE_DEFAULTS, getFeatureFlag, hasServiceMode, seedEventSettings } = require("../tenant-platform/services/tenantTypeDefaults.service");

jest.mock("../DAOs/auth.dao", () => ({
  updateSetting: jest.fn().mockResolvedValue({ key: "test", value: {} }),
}));

const { updateSetting } = require("../DAOs/auth.dao");

describe("Event Vertical Defaults", () => {
  describe("TYPE_DEFAULTS", () => {
    it("includes event key with correct service modes", () => {
      expect(TYPE_DEFAULTS.event).toBeDefined();
      expect(TYPE_DEFAULTS.event.serviceModes).toEqual([
        "ticketed_entry",
        "vip_access",
        "general_admission",
        "table_reservation",
        "event_checkin",
      ]);
    });

    it("includes event key with correct feature flags", () => {
      expect(TYPE_DEFAULTS.event.featureFlags).toEqual({
        table_management: false,
        waitlist: false,
        staff_scheduling: true,
        loyalty: true,
        pos_sync: false,
        event_ticketing: true,
        event_guest_list: true,
        event_vip_lounge: true,
        event_table_reservation: true,
        event_access_control: true,
        event_qr_checkin: false,
        event_whatsapp_invites: false,
      });
    });

    it("includes event-specific restaurant types", () => {
      expect(TYPE_DEFAULTS.vip_lounge).toBeDefined();
      expect(TYPE_DEFAULTS.conference).toBeDefined();
      expect(TYPE_DEFAULTS.festival).toBeDefined();
      expect(TYPE_DEFAULTS.corporate).toBeDefined();
    });

    it("includes eventDefaults", () => {
      expect(TYPE_DEFAULTS.eventDefaults).toBeDefined();
      expect(TYPE_DEFAULTS.eventDefaults.event_venue_config).toBeDefined();
      expect(TYPE_DEFAULTS.eventDefaults.event_checkin_config).toBeDefined();
    });
  });

  describe("applyTypeDefaults", () => {
    it("applies event defaults when restaurantType is event", () => {
      const tenant = { settings: {}, serviceModes: [], restaurantType: "" };
      const result = applyTypeDefaults(tenant, "event");
      expect(result.serviceModes).toEqual([
        "ticketed_entry",
        "vip_access",
        "general_admission",
        "table_reservation",
        "event_checkin",
      ]);
      expect(result.settings.featureFlags.event_guest_list).toBe(true);
      expect(result.restaurantType).toBe("event");
    });

    it("applies vip_lounge defaults", () => {
      const tenant = { settings: {}, serviceModes: [], restaurantType: "" };
      const result = applyTypeDefaults(tenant, "vip_lounge");
      expect(result.serviceModes).toEqual([
        "vip_access",
        "table_reservation",
        "event_checkin",
      ]);
      expect(result.settings.featureFlags.event_vip_lounge).toBe(true);
      expect(result.settings.featureFlags.event_qr_checkin).toBe(true);
    });

    it("applies conference defaults", () => {
      const tenant = { settings: {}, serviceModes: [], restaurantType: "" };
      const result = applyTypeDefaults(tenant, "conference");
      expect(result.serviceModes).toEqual([
        "ticketed_entry",
        "general_admission",
        "event_checkin",
      ]);
      expect(result.settings.featureFlags.event_qr_checkin).toBe(true);
      expect(result.settings.featureFlags.event_whatsapp_invites).toBe(true);
    });
  });

  describe("getFeatureFlag", () => {
    it("returns true for enabled event flags", () => {
      const tenant = {
        settings: {
          featureFlags: { event_vip_lounge: true, event_guest_list: false },
        },
      };
      expect(getFeatureFlag(tenant, "event_vip_lounge")).toBe(true);
      expect(getFeatureFlag(tenant, "event_guest_list")).toBe(false);
    });

    it("returns false for missing flags", () => {
      const tenant = { settings: {} };
      expect(getFeatureFlag(tenant, "event_vip_lounge")).toBe(false);
    });
  });

  describe("hasServiceMode", () => {
    it("returns true for event service modes", () => {
      const tenant = { serviceModes: ["vip_access", "event_checkin"] };
      expect(hasServiceMode(tenant, "vip_access")).toBe(true);
      expect(hasServiceMode(tenant, "dine_in")).toBe(false);
    });
  });

  describe("seedEventSettings", () => {
    it("seeds event venue and checkin config", async () => {
      await seedEventSettings(1);
      expect(updateSetting).toHaveBeenCalledWith("event_venue_config", { capacity: 0, zones: [] }, 1);
      expect(updateSetting).toHaveBeenCalledWith("event_checkin_config", { enabled: false, qrCode: true, offlineMode: false }, 1);
    });
  });
});
