<script setup>
defineProps({
  size: { type: String, default: "md" },
  text: { type: String, default: "" },
});
</script>

<template>
  <div class="loading-spinner" role="status" aria-live="polite">
    <div class="spinner" :class="`spinner-${size || 'md'}`"></div>
    <p v-if="text" class="loading-text">{{ text }}</p>
  </div>
</template>

<style scoped>
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 20px;
}

.spinner {
  border: 3px solid var(--border);
  border-top-color: var(--sky-600);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner-sm {
  width: 20px;
  height: 20px;
  border-width: 2px;
}

.spinner-md {
  width: 32px;
  height: 32px;
}

.spinner-lg {
  width: 40px;
  height: 40px;
  border-width: 4px;
}

.loading-text {
  font-family: "Inter-Light";
  font-size: 14px;
  color: var(--ink-muted);
  margin: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
