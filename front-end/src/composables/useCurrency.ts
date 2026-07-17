import { computed } from "vue";
import { useAuthStore } from "@/stores/auth";

export function useCurrency() {
  const authStore = useAuthStore();
  const currency = computed(() => authStore.currencyLocale.currency || "GHS");
  const locale = computed(() => authStore.currencyLocale.locale || "en-GH");

  const format = (amount: number | string | null | undefined) =>
    new Intl.NumberFormat(locale.value, {
      style: "currency",
      currency: currency.value,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount) || 0);

  return { currency, locale, format };
}
