import { describe, it, expect } from "vitest";
import { computed } from "vue";

function createAppointmentFilter(appointments, dateStr = "") {
  return computed(() => {
    if (!dateStr) return appointments;
    return appointments.filter((a) => {
      const start = a.start || "";
      return start.startsWith(dateStr);
    });
  });
}

function formatTime(v) {
  if (!v) return "—";
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(v)) {
    const [h, m] = v.split(":").map(Number);
    const hour = h % 24;
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
  }
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

describe("AppointmentsView filter and formatting logic", () => {
  const appointments = [
    {
      id: 1,
      start: "2026-08-13T09:00:00",
      durationMinutes: 60,
      status: "confirmed",
      customer: { firstName: "Alice", lastName: "Smith" },
      service: { name: "Haircut" },
      station: { name: "S1" },
    },
    {
      id: 2,
      start: "2026-08-13T10:30:00",
      durationMinutes: 90,
      status: "pending",
      customer: { firstName: "Bob", lastName: "Jones" },
      service: { name: "Color" },
      station: { name: "S2" },
    },
    {
      id: 3,
      start: "2026-08-14T14:00:00",
      durationMinutes: 45,
      status: "confirmed",
      customer: { firstName: "Carol", lastName: "White" },
      service: { name: " manicure" },
      station: null,
    },
  ];

  it("filters appointments by date", () => {
    const filtered = createAppointmentFilter(appointments, "2026-08-13");
    expect(filtered.value).toHaveLength(2);
    expect(filtered.value.map((a) => a.id)).toEqual([1, 2]);
  });

  it("returns all appointments when date is empty", () => {
    const filtered = createAppointmentFilter(appointments, "");
    expect(filtered.value).toHaveLength(3);
  });

  it("returns empty array when no matches", () => {
    const filtered = createAppointmentFilter(appointments, "2026-08-15");
    expect(filtered.value).toHaveLength(0);
  });

  it("formats time correctly from HH:MM:SS", () => {
    expect(formatTime("09:00:00")).toBe("9:00 AM");
    expect(formatTime("14:30:00")).toBe("2:30 PM");
    expect(formatTime("00:00:00")).toBe("12:00 AM");
    expect(formatTime("12:00:00")).toBe("12:00 PM");
  });

  it("formats time correctly from HH:MM", () => {
    expect(formatTime("09:00")).toBe("9:00 AM");
    expect(formatTime("14:30")).toBe("2:30 PM");
  });

  it("returns dash for empty time", () => {
    expect(formatTime("")).toBe("—");
    expect(formatTime(null)).toBe("—");
  });

  it("falls back to Date parsing for ISO strings", () => {
    const result = formatTime("2026-08-13T09:00:00Z");
    expect(result).not.toBe("—");
  });

  it("returns original value for unparseable strings", () => {
    expect(formatTime("not-a-time")).toBe("not-a-time");
  });
});
