const { parseDate, parseTime } = require("../utils/whatsappDateParser");
const geocodingService = require("../services/geocoding.service");

jest.mock("axios");

describe("whatsappDateParser", () => {
  const fixedNow = new Date(2026, 6, 21, 14, 0, 0);

  describe("parseDate", () => {
    it("parses 'today'", () => {
      expect(parseDate("today", fixedNow)).toBe("2026-07-21");
    });

    it("parses 'tomorrow'", () => {
      expect(parseDate("tomorrow", fixedNow)).toBe("2026-07-22");
    });

    it("parses 'tmr' and 'tmrw' as tomorrow", () => {
      expect(parseDate("tmr", fixedNow)).toBe("2026-07-22");
      expect(parseDate("tmrw", fixedNow)).toBe("2026-07-22");
    });

    it("parses 'day after tomorrow'", () => {
      expect(parseDate("day after tomorrow", fixedNow)).toBe("2026-07-23");
    });

    it("parses ISO date YYYY-MM-DD", () => {
      expect(parseDate("2026-08-15", fixedNow)).toBe("2026-08-15");
    });

    it("parses DD/MM/YYYY", () => {
      expect(parseDate("15/08/2026", fixedNow)).toBe("2026-08-15");
    });

    it("parses weekday names", () => {
      expect(parseDate("monday", new Date(2026, 6, 21))).toBe("2026-07-27");
    });

    it("returns null for unparseable input", () => {
      expect(parseDate("xyz123", fixedNow)).toBeNull();
      expect(parseDate("", fixedNow)).toBeNull();
      expect(parseDate(null, fixedNow)).toBeNull();
    });
  });

  describe("parseTime", () => {
    it("parses '7pm'", () => {
      expect(parseTime("7pm")).toBe("19:00:00");
    });

    it("parses '7:30 PM'", () => {
      expect(parseTime("7:30 PM")).toBe("19:30:00");
    });

    it("parses '12pm' as noon", () => {
      expect(parseTime("12pm")).toBe("12:00:00");
    });

    it("parses '12am' as midnight", () => {
      expect(parseTime("12am")).toBe("00:00:00");
    });

    it("parses '19:00' (24-hour)", () => {
      expect(parseTime("19:00")).toBe("19:00:00");
    });

    it("parses bare hour '7'", () => {
      expect(parseTime("7")).toBe("07:00:00");
    });

    it("parses military time '1930'", () => {
      expect(parseTime("1930")).toBe("19:30:00");
    });

    it("returns null for invalid time", () => {
      expect(parseTime("25:00")).toBeNull();
      expect(parseTime("xyz")).toBeNull();
      expect(parseTime(null)).toBeNull();
    });
  });
});

describe("geocoding.service — region resolution", () => {
  it("resolves Greater Accra coordinates", () => {
    expect(geocodingService.resolveRegionFromCoords(5.6037, -0.187)).toBe("Greater Accra");
  });

  it("resolves Ashanti coordinates", () => {
    expect(geocodingService.resolveRegionFromCoords(6.6884, -1.6244)).toBe("Ashanti");
  });

  it("returns null for coordinates outside Ghana", () => {
    expect(geocodingService.resolveRegionFromCoords(51.5074, -0.1278)).toBeNull();
  });

  it("returns null for invalid coordinates", () => {
    expect(geocodingService.resolveRegionFromCoords("abc", "xyz")).toBeNull();
  });

  it("has 16 Ghana regions defined", () => {
    expect(geocodingService.GHANA_REGIONS.length).toBe(16);
  });
});
