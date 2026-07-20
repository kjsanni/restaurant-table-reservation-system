import { defineStore } from "pinia";
import { ref } from "vue";

export const useReservationStore = defineStore("reservation", () => {
  const stats = ref({ today: 0, week: 0, month: 0 });

  const incrementStats = () => {
    stats.value.today += 1;
  };

  const reset = () => {
    stats.value = { today: 0, week: 0, month: 0 };
  };

  return { stats, incrementStats, reset };
});
