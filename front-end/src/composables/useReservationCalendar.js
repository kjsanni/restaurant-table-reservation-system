import { ref, computed } from "vue";
import dateNavigator from "@/utils/dateNavigator";

export const PRESET_RANGES = {
  today: { label: "Today", days: 1 },
  week: { label: "This Week", days: 7 },
  month: { label: "This Month", days: 30 },
};

export function useToday() {
  const today = ref(dateNavigator.asDateString(new Date()));
  return today;
}

export function useDaysAgo(initial = 30) {
  const getDaysAgo = () => {
    const d = new Date();
    d.setDate(d.getDate() - initial);
    return dateNavigator.asDateString(d);
  };
  const daysAgo = ref(getDaysAgo());
  const setDaysAgo = (n) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    daysAgo.value = dateNavigator.asDateString(d);
  };
  return { daysAgo, setDaysAgo, getDaysAgo };
}

export function useDateRange(presetKey = "month") {
  const rangeMode = ref(presetKey);
  const customFrom = ref("");
  const customTo = ref("");

  const getDateRange = () => {
    if (rangeMode.value === "custom" && customFrom.value && customTo.value) {
      return { from: customFrom.value, to: customTo.value };
    }
    const days = PRESET_RANGES[rangeMode.value]?.days || 30;
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - days);
    return {
      from: dateNavigator.asDateString(from),
      to: dateNavigator.asDateString(to),
    };
  };

  const dateRangeLabel = computed(() => {
    if (rangeMode.value === "custom" && customFrom.value && customTo.value) {
      return `${customFrom.value} → ${customTo.value}`;
    }
    return PRESET_RANGES[rangeMode.value]?.label || "Custom";
  });

  return {
    rangeMode,
    customFrom,
    customTo,
    getDateRange,
    dateRangeLabel,
    PRESET_RANGES,
  };
}
