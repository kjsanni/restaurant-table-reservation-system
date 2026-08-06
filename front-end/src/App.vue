<script setup lang="ts">
import { ref, provide } from "vue";
import { useTenantBranding } from "@/composables/useTenantBranding";
import { getCurrentInstance } from "vue";
import { useI18n, type UseI18nReturn } from "@/composables/useI18n";
import OfflineBanner from "@/components/OfflineBanner.vue";

useTenantBranding();
const i18n = useI18n();
provide("i18n", i18n);

const app = getCurrentInstance()?.appContext?.app;
if (app) {
  app.config.errorHandler = (err) => handleError(err, "vue");
}

const hasError = ref(false);
const errorMessage = ref("");

const handleError = (err: unknown, context = "app") => {
  console.error(`[${context}]`, err);
  hasError.value = true;
  errorMessage.value =
    (err as Error)?.message || "Something went wrong. Please refresh the page.";
};

window.addEventListener("error", (event) => {
  handleError(event.error, "window");
});

window.addEventListener("unhandledrejection", (event) => {
  handleError(event.reason, "unhandledrejection");
});

const resetError = () => {
  hasError.value = false;
  errorMessage.value = "";
};
</script>

<template>
  <div v-if="hasError" class="error-boundary">
    <div class="error-boundary-inner">
      <h1>Something went wrong</h1>
      <p>{{ errorMessage }}</p>
      <button class="retry-btn" @click="resetError">Try again</button>
    </div>
  </div>
  <div v-else class="app-shell">
    <OfflineBanner />
    <RouterView />
  </div>
</template>

<style scoped>
.app-shell {
  padding-top: 0;
}
</style>

<style scoped>
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--space-8);
  background: var(--surface);
}
.error-boundary-inner {
  text-align: center;
  max-width: 420px;
}
.error-boundary-inner h1 {
  font-family: var(--font-sans);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--ink);
  margin-bottom: var(--space-3);
}
.error-boundary-inner p {
  font-size: var(--text-base);
  color: var(--ink-secondary);
  margin-bottom: var(--space-5);
}
.retry-btn {
  padding: 10px 24px;
  border-radius: var(--radius-lg);
  border: none;
  background: var(--accent-500);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out);
}
.retry-btn:hover {
  background: var(--accent-600);
}
</style>
