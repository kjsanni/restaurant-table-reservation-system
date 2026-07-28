"use strict";

const { t, getLocale, getTranslation, messages } = require("../locales");

describe("backend i18n", () => {
  describe("getLocale", () => {
    it("returns user locale when present", () => {
      expect(getLocale({ user: { locale: "tw" } })).toBe("tw");
    });

    it("falls back to req.locale", () => {
      expect(getLocale({ locale: "gaa" })).toBe("gaa");
    });

    it("falls back to en when no locale available", () => {
      expect(getLocale({})).toBe("en");
    });
  });

  describe("t", () => {
    it("translates English keys", () => {
      expect(t("common.notFound", "en")).toBe("Not found");
    });

    it("translates Twi keys", () => {
      expect(t("common.notFound", "tw")).toBe("Nnhu");
    });

    it("translates Ga keys", () => {
      expect(t("common.notFound", "gaa")).toBe("Nhu");
    });

    it("falls back to English when key missing in target locale", () => {
      expect(t("common.someMissingKey", "tw")).toBe("common.someMissingKey");
    });

    it("falls back to key when missing in all locales", () => {
      expect(t("missing.key", "en")).toBe("missing.key");
    });

    it("replaces placeholders in English", () => {
      expect(t("salon.refundSuccess", "en", { id: 42 })).toBe("Refund processed successfully for appointment #42");
    });

    it("replaces placeholders in Twi", () => {
      expect(t("salon.refundSuccess", "tw", { id: 42 })).toBe("Wasan sika ma nhyiamu #42 yie");
    });

    it("replaces placeholders in Ga", () => {
      expect(t("salon.refundSuccess", "gaa", { id: 42 })).toBe("Wasan sika ma nhyiamu #42 yie");
    });

    it("localizes salon.appointmentNotFound", () => {
      expect(t("salon.appointmentNotFound", "en")).toBe("Appointment not found");
      expect(t("salon.appointmentNotFound", "tw")).toBe("Nhyiamu no nhu");
      expect(t("salon.appointmentNotFound", "gaa")).toBe("Nhyiamu no nhu");
    });

    it("localizes common.internalError", () => {
      expect(t("common.internalError", "en")).toBe("Something went wrong. Please try again later.");
      expect(t("common.internalError", "tw")).toBe("Asiane bi aba. Yɛsrɛ wo bɔ bio abera biara.");
      expect(t("common.internalError", "gaa")).toBe("Asiane bi aba. Yɛsrɛ wo bɔ bio abera biara.");
    });
  });

  describe("getTranslation", () => {
    it("returns null for missing keys", () => {
      expect(getTranslation("en", "does.not.exist")).toBeNull();
    });
  });

  describe("messages structure", () => {
    it("has en, tw, and gaa locales", () => {
      expect(messages.en).toBeDefined();
      expect(messages.tw).toBeDefined();
      expect(messages.gaa).toBeDefined();
    });

    it("has common and salon namespaces", () => {
      expect(messages.en.common).toBeDefined();
      expect(messages.en.salon).toBeDefined();
    });
  });
});
