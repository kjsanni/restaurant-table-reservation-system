<script setup lang="ts">
import { useI18n } from "@/composables/useI18n";

const { locale, setLocale, availableLocales } = useI18n();
</script>

<template>
  <select
    class="locale-select"
    :value="locale"
    @change="(e) => setLocale((e.target as HTMLSelectElement).value as any)"
    aria-label="Select language"
  >
    <option
      v-for="item in availableLocales"
      :key="item.code"
      :value="item.code"
    >
      {{ item.name }}
    </option>
  </select>
</template>

<style scoped>
.locale-select {
  padding: 6px 10px;
  border-radius: var(--radius-md);
  border: 1px solid var(--neutral-200);
  background: var(--white);
  color: var(--neutral-900);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}
</style>
