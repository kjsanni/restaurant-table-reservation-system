import { defineStore } from "pinia";
import { ref } from "vue";

export const useToastStore = defineStore("toast", () => {
  const toasts = ref([]);

  const add = (message, type = "info", duration = 3000) => {
    const id = Date.now() + Math.random();
    toasts.value.push({ id, message, type });
    if (duration > 0) {
      setTimeout(() => remove(id), duration);
    }
    return id;
  };

  const remove = (id) => {
    const idx = toasts.value.findIndex((t) => t.id === id);
    if (idx !== -1) toasts.value.splice(idx, 1);
  };

  return { toasts, add, remove };
});
