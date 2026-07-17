import { describe, it, expect } from "vitest";
import { ref, computed } from "vue";

function createFilterReservations(
  reservations,
  currentMonth,
  searchVal = "",
  searchNotes = false
) {
  const currentMonthRef = ref(currentMonth);
  const searchValRef = ref(searchVal);
  const searchNotesRef = ref(searchNotes);

  return computed(() => {
    const dateStr = currentMonthRef.value.toISOString().split("T")[0];
    const prefix = dateStr.slice(0, 7);
    let filtered = reservations.filter(
      (r) => r.resDate && r.resDate.startsWith(prefix)
    );

    const query = searchValRef.value.trim().toLowerCase();
    if (query) {
      filtered = filtered.filter((item) => {
        const searchableKeys = searchNotesRef.value
          ? Object.keys(item)
          : Object.keys(item).filter((key) => key !== "notes");

        return searchableKeys.some((key) => {
          const val = item[key];
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(query);
        });
      });
    }

    return filtered;
  });
}

describe("TheReservations filter logic", () => {
  const reservations = [
    {
      id: 1,
      resDate: "2026-07-01",
      resTime: "12:00",
      resStatus: "confirmed",
      notes: "window",
      name: "Alice",
    },
    {
      id: 2,
      resDate: "2026-07-15",
      resTime: "13:00",
      resStatus: "pending",
      notes: "door",
      name: "Bob",
    },
    {
      id: 3,
      resDate: "2026-08-01",
      resTime: "14:00",
      resStatus: "confirmed",
      notes: "window",
      name: "Charlie",
    },
    {
      id: 4,
      resDate: "2026-07-20",
      resTime: "15:00",
      resStatus: "cancelled",
      notes: null,
      name: "Diana",
    },
  ];

  it("should filter by current month prefix", () => {
    const currentMonth = new Date("2026-07-15T00:00:00.000Z");
    const filtered = createFilterReservations(reservations, currentMonth);
    expect(filtered.value).toHaveLength(3);
    expect(filtered.value.map((r) => r.id)).toEqual([1, 2, 4]);
  });

  it("should filter by search query excluding notes by default", () => {
    const currentMonth = new Date("2026-07-15T00:00:00.000Z");
    const filtered = createFilterReservations(
      reservations,
      currentMonth,
      "alice"
    );
    expect(filtered.value).toHaveLength(1);
    expect(filtered.value[0].id).toBe(1);
  });

  it("should include notes in search when searchNotes is true", () => {
    const currentMonth = new Date("2026-07-15T00:00:00.000Z");
    const filtered = createFilterReservations(
      reservations,
      currentMonth,
      "door",
      true
    );
    expect(filtered.value).toHaveLength(1);
    expect(filtered.value[0].id).toBe(2);
  });

  it("should return all reservations for month when no search query", () => {
    const currentMonth = new Date("2026-07-15T00:00:00.000Z");
    const filtered = createFilterReservations(reservations, currentMonth);
    expect(filtered.value).toHaveLength(3);
  });

  it("should handle empty reservations array", () => {
    const currentMonth = new Date("2026-07-15T00:00:00.000Z");
    const filtered = createFilterReservations([], currentMonth);
    expect(filtered.value).toHaveLength(0);
  });
});
