import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import Heatmap2D from "../Heatmap2D.vue";

vi.mock("@/services/reservationAPI", () => ({
  default: {
    getHeatmapV2: vi.fn(),
  },
}));

import reservationAPI from "@/services/reservationAPI";

describe("Heatmap2D", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reservationAPI.getHeatmapV2.mockResolvedValue({
      data: {
        dates: ["2026-06-29", "2026-06-30"],
        hours: ["12", "13", "14"],
        matrix: [
          [2, 3, 1],
          [0, 4, 2],
        ],
        totalsPerDay: [6, 6],
        totalsPerHour: [2, 7, 3],
      },
    });
  });

  const waitForApi = () => new Promise((r) => setTimeout(r, 400));

  it("should fetch heatmap data on mount", async () => {
    mount(Heatmap2D, {
      props: { mode: "date-hour", from: "2026-06-01", to: "2026-06-30" },
    });

    await waitForApi();

    expect(reservationAPI.getHeatmapV2).toHaveBeenCalledWith({
      from: "2026-06-01",
      to: "2026-06-30",
      mode: "date-hour",
    });
  });

  it("should use default dates when not provided", async () => {
    mount(Heatmap2D, {
      props: { mode: "date-hour" },
    });

    await waitForApi();

    const callArgs = reservationAPI.getHeatmapV2.mock.calls[0][0];
    expect(callArgs.from).toBeDefined();
    expect(callArgs.to).toBeDefined();
  });

  it("should render in date-hour mode with correct grid structure", async () => {
    const wrapper = mount(Heatmap2D, {
      props: { mode: "date-hour", from: "2026-06-01", to: "2026-06-30" },
    });

    await waitForApi();
    await wrapper.vm.$nextTick();

    expect(wrapper.find(".matrix-grid").exists()).toBe(true);
    expect(wrapper.findAll(".matrix-cell").length).toBeGreaterThan(0);
  });

  it("should render in calendar mode with day cells", async () => {
    reservationAPI.getHeatmapV2.mockResolvedValue({
      data: {
        days: Array.from({ length: 7 }, (_, i) => ({
          date: `2026-07-${String(i + 1).padStart(2, "0")}`,
          count: i + 1,
          peakHour: "19:00",
          peakCount: i + 1,
        })),
      },
    });

    const wrapper = mount(Heatmap2D, {
      props: { mode: "calendar", from: "2026-07-01", to: "2026-07-31" },
    });

    await waitForApi();
    await wrapper.vm.$nextTick();

    expect(wrapper.find(".calendar-grid").exists()).toBe(true);
    expect(wrapper.findAll(".calendar-day").length).toBeGreaterThan(0);
  });

  it("should open drill-down popup when clicking a calendar day", async () => {
    reservationAPI.getHeatmapV2
      .mockResolvedValueOnce({
        data: {
          days: [{ date: "2026-06-29", count: 5, peakHour: "12:00", peakCount: 3 }],
        },
      })
      .mockResolvedValueOnce({
        data: {
          dates: ["2026-06-29"],
          hours: ["12", "13", "14"],
          matrix: [[2, 3, 1]],
          totalsPerDay: [6],
          totalsPerHour: [2, 7, 3],
        },
      });

    const wrapper = mount(Heatmap2D, {
      props: { mode: "calendar", from: "2026-06-01", to: "2026-06-30" },
    });

    await waitForApi();
    await wrapper.vm.$nextTick();

    const firstDay = wrapper.find(".calendar-day");
    await firstDay.trigger("click");
    await waitForApi();
    await wrapper.vm.$nextTick();

    const secondCall = reservationAPI.getHeatmapV2.mock.calls[1][0];
    expect(secondCall).toEqual({
      from: "2026-06-29",
      to: "2026-06-29",
      mode: "date-hour",
    });

    expect(wrapper.find(".drill-down").exists()).toBe(true);
  });

  it("should show error state and retry button on API failure", async () => {
    reservationAPI.getHeatmapV2.mockRejectedValueOnce(new Error("Network error"));

    const wrapper = mount(Heatmap2D, {
      props: { mode: "date-hour" },
    });

    await waitForApi();
    await wrapper.vm.$nextTick();

    expect(wrapper.find(".error-state").exists()).toBe(true);
    expect(wrapper.text()).toContain("Failed to load heatmap data.");
    expect(wrapper.find(".retry-btn").exists()).toBe(true);
  });

  it("should show empty state when no data returned", async () => {
    reservationAPI.getHeatmapV2.mockResolvedValueOnce({
      data: null,
    });

    const wrapper = mount(Heatmap2D, {
      props: { mode: "date-hour" },
    });

    await waitForApi();
    await wrapper.vm.$nextTick();

    expect(wrapper.find(".empty-state").exists()).toBe(true);
    expect(wrapper.text()).toContain("No data for selected range.");
  });

  it("should display mode toggle buttons", async () => {
    const wrapper = mount(Heatmap2D, {
      props: { mode: "date-hour" },
    });

    expect(wrapper.find(".mode-toggle").exists()).toBe(true);
    expect(wrapper.findAll(".mode-btn").length).toBe(2);
  });

  it("should emit mode change when toggle clicked", async () => {
    const wrapper = mount(Heatmap2D, {
      props: { mode: "date-hour" },
    });

    const calendarBtn = wrapper.findAll(".mode-btn").at(1);
    await calendarBtn.trigger("click");

    expect(wrapper.emitted("update:mode")).toBeTruthy();
    expect(wrapper.emitted("update:mode")[0]).toEqual(["calendar"]);
  });

  it("should display legend with gradient and ticks", async () => {
    const wrapper = mount(Heatmap2D, {
      props: { mode: "date-hour" },
    });

    await waitForApi();
    await wrapper.vm.$nextTick();

    expect(wrapper.find(".legend").exists()).toBe(true);
    expect(wrapper.find(".legend-gradient-fill").exists()).toBe(true);
    expect(wrapper.findAll(".legend-ticks span").length).toBeGreaterThan(0);
  });
});
