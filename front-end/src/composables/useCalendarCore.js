import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { io } from "socket.io-client";
import scheduleAPI from "@/services/scheduleAPI";
import reservationAPI from "@/services/reservationAPI";
import tableAPI from "@/services/tableAPI";
import groupAPI from "@/services/groupAPI";
import dateNavigator from "@/utils/dateNavigator";
import { statusColor, shortName } from "@/utils/reservationDisplay";

export function useCalendarCore(extraDeps = {}) {
  const schedules = ref([]);
  const holidays = ref([]);
  const reservations = ref([]);
  const loading = ref(true);
  const currentMonth = ref(new Date());
  const monthLabel = ref("");
  const calendarDays = ref([]);
  const socket = ref(null);
  const selectedDay = ref(null);
  const dayPopupOpen = ref(false);
  const freeTables = ref([]);
  const allTables = ref([]);
  const waitingStaffList = ref([]);

  const MAX_VISIBLE = 3;

  const loadSchedule = async () => {
    loading.value = true;
    const year = currentMonth.value.getFullYear();
    const month = currentMonth.value.getMonth();
    monthLabel.value = currentMonth.value.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

    const [schedulesRes, holidaysRes, reservationsRes] = await Promise.all([
      scheduleAPI.getSchedules(),
      scheduleAPI.getHolidays(),
      reservationAPI.getReservations(),
    ]);

    schedules.value = schedulesRes.data.schedules;
    holidays.value = holidaysRes.data.holidays;
    reservations.value = reservationsRes.data.collection;

    buildCalendarDays(year, month);
  };

  const loadSchedules = async () => {
    const res = await scheduleAPI.getSchedules();
    schedules.value = res.data.schedules;
    buildCalendarDaysFromCurrent();
  };

  const loadHolidays = async () => {
    const res = await scheduleAPI.getHolidays();
    holidays.value = res.data.holidays;
    buildCalendarDaysFromCurrent();
  };

  const loadReservations = async () => {
    const res = await reservationAPI.getReservations();
    reservations.value = res.data.collection;
    buildCalendarDaysFromCurrent();
  };

  const buildCalendarDaysFromCurrent = () => {
    const year = currentMonth.value.getFullYear();
    const month = currentMonth.value.getMonth();
    buildCalendarDays(year, month);
  };

  const buildCalendarDays = (year, month, typeFilter = "all") => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push({ date: null, isCurrentMonth: false });
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateStr = dateNavigator.asDateString(date);
      const dayOfWeek = date
        .toLocaleDateString("en-US", { weekday: "long" })
        .toLowerCase();

      const schedule = schedules.value.find((s) => s.dayOfWeek === dayOfWeek);
      const holiday = holidays.value.find((h) => h.date === dateStr);
      const isClosed = holiday?.isClosed || schedule?.isClosed || false;
      const showReservations = typeFilter === "all" || typeFilter === "reservations";
      const showHoliday = typeFilter === "all" || typeFilter === "holidays";
      const showClosed = typeFilter === "all" || typeFilter === "closed";

      const dayReservations = showReservations
        ? reservations.value
            .filter((r) => r.resDate === dateStr)
            .sort((a, b) => a.resTime.localeCompare(b.resTime))
        : [];

      const statusTally = {};
      dayReservations.forEach((r) => {
        const s = r.resStatus || "pending";
        statusTally[s] = (statusTally[s] || 0) + 1;
      });
      const dominantStatus =
        Object.keys(statusTally).sort(
          (a, b) => statusTally[b] - statusTally[a]
        )[0] || null;

      days.push({
        date: day,
        dateStr,
        isCurrentMonth: true,
        isClosed: isClosed && showClosed,
        isHoliday: !!holiday && showHoliday,
        holidayDesc: showHoliday ? holiday?.description : "",
        openTime: holiday?.openTime || schedule?.openTime,
        closeTime: holiday?.closeTime || schedule?.closeTime,
        reservations: dayReservations,
        visibleReservations: dayReservations.slice(0, MAX_VISIBLE),
        overflowCount: Math.max(0, dayReservations.length - MAX_VISIBLE),
        dominantStatus,
      });
    }

    calendarDays.value = days;
    loading.value = false;
  };

  const openDay = (day) => {
    selectedDay.value = day;
    dayPopupOpen.value = true;
  };

  const closeDayPopup = () => {
    dayPopupOpen.value = false;
    selectedDay.value = null;
  };

  const previousMonth = () => {
    currentMonth.value = new Date(
      currentMonth.value.getFullYear(),
      currentMonth.value.getMonth() - 1,
      1
    );
    loadSchedule();
  };

  const nextMonth = () => {
    currentMonth.value = new Date(
      currentMonth.value.getFullYear(),
      currentMonth.value.getMonth() + 1,
      1
    );
    loadSchedule();
  };

  const connectSocket = () => {
    socket.value = io("", {
      path: "/socket.io",
    });
    socket.value.on("schedule-updated", () => loadSchedules());
    socket.value.on("holiday-updated", () => loadHolidays());
    socket.value.on("reservation-created", () => loadReservations());
    socket.value.on("reservation-updated", () => loadReservations());
    socket.value.on("table-freed", () => {
      if (extraDeps.onTableFreed) extraDeps.onTableFreed();
    });
  };

  const disconnectSocket = () => {
    if (socket.value) {
      socket.value.disconnect();
      socket.value = null;
    }
  };

  onMounted(async () => {
    await loadSchedule();
    connectSocket();
  });

  onUnmounted(() => {
    disconnectSocket();
  });

  watch(
    () => currentMonth.value,
    () => {
      buildCalendarDaysFromCurrent();
    }
  );

  return {
    schedules,
    holidays,
    reservations,
    loading,
    currentMonth,
    monthLabel,
    calendarDays,
    socket,
    selectedDay,
    dayPopupOpen,
    freeTables,
    allTables,
    waitingStaffList,
    MAX_VISIBLE,
    loadSchedule,
    loadSchedules,
    loadHolidays,
    loadReservations,
    buildCalendarDaysFromCurrent,
    buildCalendarDays,
    openDay,
    closeDayPopup,
    previousMonth,
    nextMonth,
    connectSocket,
    disconnectSocket,
  };
}
