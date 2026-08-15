import { describe, it, expect } from "vitest";
import { ref, computed } from "vue";

function createTableFilter(
  tables,
  activeStatus = "all",
  activeSection = "all"
) {
  return computed(() => {
    return tables.filter((t) => {
      const status = (
        t.status || (t.isOccupied ? "occupied" : "free")
      ).toLowerCase();
      const section = (t.section || "main").toLowerCase();
      const matchStatus = activeStatus === "all" || status === activeStatus;
      const matchSection = activeSection === "all" || section === activeSection;
      return matchStatus && matchSection;
    });
  });
}

function createStatusCounts(tables) {
  const counts = { all: tables.length };
  for (const t of tables) {
    const status = (
      t.status || (t.isOccupied ? "occupied" : "free")
    ).toLowerCase();
    counts[status] = (counts[status] || 0) + 1;
  }
  return counts;
}

describe("TableManagementView filter logic", () => {
  const tables = [
    { id: 1, status: "occupied", section: "main" },
    { id: 2, status: "free", section: "main" },
    { id: 3, status: "reserved", section: "patio" },
    { id: 4, status: "blocked", section: "main" },
    { id: 5, status: "occupied", section: "patio" },
  ];

  it("returns all tables when status filter is all", () => {
    const filtered = createTableFilter(tables, "all", "all");
    expect(filtered.value).toHaveLength(5);
  });

  it("filters by occupied status", () => {
    const filtered = createTableFilter(tables, "occupied", "all");
    expect(filtered.value).toHaveLength(2);
    expect(filtered.value.map((t) => t.id)).toEqual([1, 5]);
  });

  it("filters by free status", () => {
    const filtered = createTableFilter(tables, "free", "all");
    expect(filtered.value).toHaveLength(1);
    expect(filtered.value[0].id).toBe(2);
  });

  it("filters by section", () => {
    const filtered = createTableFilter(tables, "all", "patio");
    expect(filtered.value).toHaveLength(2);
    expect(filtered.value.map((t) => t.id)).toEqual([3, 5]);
  });

  it("filters by status and section combined", () => {
    const filtered = createTableFilter(tables, "occupied", "patio");
    expect(filtered.value).toHaveLength(1);
    expect(filtered.value[0].id).toBe(5);
  });

  it("computes correct status counts", () => {
    const counts = createStatusCounts(tables);
    expect(counts.all).toBe(5);
    expect(counts.occupied).toBe(2);
    expect(counts.free).toBe(1);
    expect(counts.reserved).toBe(1);
    expect(counts.blocked).toBe(1);
  });

  it("falls back to isOccupied when status is missing", () => {
    const items = [
      { id: 1, isOccupied: true },
      { id: 2, isOccupied: false },
    ];
    const filtered = createTableFilter(items, "occupied", "all");
    expect(filtered.value).toHaveLength(1);
    expect(filtered.value[0].id).toBe(1);
  });

  it("defaults section to main when missing", () => {
    const items = [
      { id: 1, status: "free", section: "patio" },
      { id: 2, status: "free" },
    ];
    const filtered = createTableFilter(items, "all", "main");
    expect(filtered.value).toHaveLength(1);
    expect(filtered.value[0].id).toBe(2);
  });

  it("handles empty tables array", () => {
    const filtered = createTableFilter([], "all", "all");
    expect(filtered.value).toHaveLength(0);
  });
});
