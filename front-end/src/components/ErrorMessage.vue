<script setup>
defineProps({
  errorFlag: { type: [Boolean, String, Object], default: null },
  errorMessage: { type: String, default: "An error occurred." },
});
</script>

<template>
  <div v-if="errorFlag" class="error-banner-component" role="alert">
    <span class="error-icon" aria-hidden="true">⚠️</span>
    <span class="error-message">{{ errorMessage }}</span>
  </div>
</template>

<style scoped>
.error-banner-component {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  background: var(--danger-soft);
  border: 1px solid var(--rose-200);
  border-radius: var(--card-radius, var(--radius-xl));
}

.error-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.error-message {
  font-family: "Public Sans", var(--font-sans);
  font-size: var(--text-sm);
  color: var(--danger);
}
</style>
