import { describe, it, expect } from "vitest";
import { useToday, useDaysAgo, useDateRange, PRESET_RANGES } from "@/composables/useReservationCalendar";

describe("useReservationCalendar", () => {
  describe("useToday", () => {
    it("should return today's date string", () => {
      const today = useToday();
      expect(today.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("useDaysAgo", () => {
    it("should return a ref with the initial days-ago date", () => {
      const { daysAgo } = useDaysAgo(30);
      expect(daysAgo.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("should update the ref via setDaysAgo", () => {
      const { daysAgo, setDaysAgo } = useDaysAgo(30);
      const original = daysAgo.value;
      setDaysAgo(7);
      expect(daysAgo.value).not.toBe(original);
    });
  });

  describe("useDateRange", () => {
    it("should provide reactive range state", () => {
      const { rangeMode, customFrom, customTo, getDateRange, dateRangeLabel, PRESET_RANGES } = useDateRange("month");

      expect(rangeMode.value).toBe("month");
      expect(customFrom.value).toBe("");
      expect(customTo.value).toBe("");
      expect(dateRangeLabel.value).toBe(PRESET_RANGES.month.label);
      expect(getDateRange()).toHaveProperty("from");
      expect(getDateRange()).toHaveProperty("to");
    });

    it("should switch to custom range when mode changes", () => {
      const { rangeMode, customFrom, customTo, dateRangeLabel, getDateRange } = useDateRange("month");
      rangeMode.value = "custom";
      customFrom.value = "2026-07-01";
      customTo.value = "2026-07-16";
      expect(dateRangeLabel.value).toBe("2026-07-01 → 2026-07-16");
      expect(getDateRange()).toEqual({ from: "2026-07-01", to: "2026-07-16" });
    });
  });

  describe("PRESET_RANGES", () => {
    it("should have today, week, and month presets", () => {
      expect(PRESET_RANGES).toHaveProperty("today");
      expect(PRESET_RANGES).toHaveProperty("week");
      expect(PRESET_RANGES).toHaveProperty("month");
      expect(PRESET_RANGES.today.days).toBe(1);
      expect(PRESET_RANGES.week.days).toBe(7);
      expect(PRESET_RANGES.month.days).toBe(30);
    });
  });
});
