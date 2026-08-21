import { describe, it, expect } from "vitest";
import { computed } from "vue";

function createReservationFilter(reservations, activeFilter = "All") {
  const filters = ["All", "Confirmed", "Pending", "Seated", "Cancelled"];

  return computed(() => {
    if (activeFilter === "All") return reservations;
    const normalized = activeFilter.toLowerCase();
    return reservations.filter(
      (r) => (r.resStatus || r.status || "").toLowerCase() === normalized
    );
  });
}

describe("ReservationsView filter logic", () => {
  const reservations = [
    { id: 1, resStatus: "confirmed", status: "confirmed", name: "Alice" },
    { id: 2, resStatus: "pending", status: "pending", name: "Bob" },
    { id: 3, resStatus: "seated", status: "seated", name: "Charlie" },
    { id: 4, resStatus: "cancelled", status: "cancelled", name: "Diana" },
    { id: 5, resStatus: "no_show", status: "no_show", name: "Eve" },
  ];

  it("returns all reservations when filter is All", () => {
    const filtered = createReservationFilter(reservations, "All");
    expect(filtered.value).toHaveLength(5);
  });

  it("filters by confirmed status", () => {
    const filtered = createReservationFilter(reservations, "Confirmed");
    expect(filtered.value).toHaveLength(1);
    expect(filtered.value[0].id).toBe(1);
  });

  it("filters by pending status", () => {
    const filtered = createReservationFilter(reservations, "Pending");
    expect(filtered.value).toHaveLength(1);
    expect(filtered.value[0].id).toBe(2);
  });

  it("filters by seated status", () => {
    const filtered = createReservationFilter(reservations, "Seated");
    expect(filtered.value).toHaveLength(1);
    expect(filtered.value[0].id).toBe(3);
  });

  it("filters by cancelled status", () => {
    const filtered = createReservationFilter(reservations, "Cancelled");
    expect(filtered.value).toHaveLength(1);
    expect(filtered.value[0].id).toBe(4);
  });

  it("returns empty array when no matches", () => {
    const filtered = createReservationFilter(reservations, "Completed");
    expect(filtered.value).toHaveLength(0);
  });

  it("handles empty reservations array", () => {
    const filtered = createReservationFilter([], "All");
    expect(filtered.value).toHaveLength(0);
  });

  it("falls back to status field when resStatus is missing", () => {
    const items = [
      { id: 1, status: "confirmed" },
      { id: 2, status: "pending" },
    ];
    const filtered = createReservationFilter(items, "Confirmed");
    expect(filtered.value).toHaveLength(1);
    expect(filtered.value[0].id).toBe(1);
  });
});
