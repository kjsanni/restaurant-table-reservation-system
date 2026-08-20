import { describe, it, expect } from "vitest";

function buildSettingsMap(settings) {
  const map = new Map();
  for (const s of settings) {
    map.set(s.key, String(s.value || ""));
  }
  return map;
}

function mapSettingsToProfile(map) {
  return {
    restaurantName:
      map.get("restaurant_name") || map.get("restaurantName") || "",
    email: map.get("email") || "",
    phone: map.get("phone") || "",
    address: map.get("address") || "",
  };
}

function mapSettingsToNotifications(map) {
  return {
    emailNotifications: map.get("email_notifications") || "all",
    smsReminders: map.get("sms_reminders") || "enabled",
  };
}

function buildSavePayload(profile) {
  return [
    { key: "restaurant_name", value: profile.restaurantName },
    { key: "email", value: profile.email },
    { key: "phone", value: profile.phone },
    { key: "address", value: profile.address },
  ];
}

describe("AdminSettingsView settings mapping", () => {
  it("maps settings array to profile form", () => {
    const settings = [
      { key: "restaurant_name", value: "Test Restaurant" },
      { key: "email", value: "test@example.com" },
      { key: "phone", value: "0244123456" },
      { key: "address", value: "123 Main St" },
    ];
    const map = buildSettingsMap(settings);
    const profile = mapSettingsToProfile(map);

    expect(profile.restaurantName).toBe("Test Restaurant");
    expect(profile.email).toBe("test@example.com");
    expect(profile.phone).toBe("0244123456");
    expect(profile.address).toBe("123 Main St");
  });

  it("falls back to camelCase key names", () => {
    const settings = [
      { key: "restaurantName", value: "My Restaurant" },
      { key: "email", value: "info@restaurant.com" },
    ];
    const map = buildSettingsMap(settings);
    const profile = mapSettingsToProfile(map);

    expect(profile.restaurantName).toBe("My Restaurant");
    expect(profile.email).toBe("info@restaurant.com");
  });

  it("uses empty string defaults when keys are missing", () => {
    const settings = [];
    const map = buildSettingsMap(settings);
    const profile = mapSettingsToProfile(map);

    expect(profile.restaurantName).toBe("");
    expect(profile.email).toBe("");
    expect(profile.phone).toBe("");
    expect(profile.address).toBe("");
  });

  it("maps notification settings correctly", () => {
    const settings = [
      { key: "email_notifications", value: "important" },
      { key: "sms_reminders", value: "disabled" },
    ];
    const map = buildSettingsMap(settings);
    const notifications = mapSettingsToNotifications(map);

    expect(notifications.emailNotifications).toBe("important");
    expect(notifications.smsReminders).toBe("disabled");
  });

  it("uses default notification values when keys are missing", () => {
    const settings = [];
    const map = buildSettingsMap(settings);
    const notifications = mapSettingsToNotifications(map);

    expect(notifications.emailNotifications).toBe("all");
    expect(notifications.smsReminders).toBe("enabled");
  });

  it("builds correct save payload from profile", () => {
    const profile = {
      restaurantName: "New Name",
      email: "new@example.com",
      phone: "0200000000",
      address: "456 Oak Ave",
    };
    const payload = buildSavePayload(profile);

    expect(payload).toHaveLength(4);
    expect(payload[0]).toEqual({ key: "restaurant_name", value: "New Name" });
    expect(payload[1]).toEqual({ key: "email", value: "new@example.com" });
    expect(payload[2]).toEqual({ key: "phone", value: "0200000000" });
    expect(payload[3]).toEqual({ key: "address", value: "456 Oak Ave" });
  });

  it("coerces null values to empty strings", () => {
    const settings = [{ key: "phone", value: null }];
    const map = buildSettingsMap(settings);
    expect(map.get("phone")).toBe("");
  });
});
