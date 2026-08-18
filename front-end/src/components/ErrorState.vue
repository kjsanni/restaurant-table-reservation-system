<script setup lang="ts">
interface Props {
  title?: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
}
const props = defineProps<Props>();
</script>

<template>
  <div class="error-state" role="alert">
    <div class="error-icon" aria-hidden="true">⚠️</div>
    <h3 v-if="title" class="error-title">{{ title }}</h3>
    <p v-if="description" class="error-description">{{ description }}</p>
    <button
      v-if="retryLabel && onRetry"
      class="error-retry"
      type="button"
      @click="onRetry"
    >
      {{ retryLabel }}
    </button>
  </div>
</template>

<style scoped>
.error-state {
  text-align: center;
  padding: var(--space-16) var(--space-6);
  color: var(--danger);
  font-family: var(--font-sans);
}
.error-icon {
  font-size: 36px;
  margin-bottom: var(--space-3);
  opacity: 0.9;
}
.error-title {
  margin: 0 0 var(--space-2);
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--ink);
}
.error-description {
  margin: 0 0 var(--space-4);
  font-size: var(--text-sm);
  color: var(--ink-muted);
}
.error-retry {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  border: 1px solid var(--danger);
  background: var(--danger-soft);
  color: var(--danger);
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: var(--text-sm);
  cursor: pointer;
  transition:
    transform var(--duration-fast) var(--ease-out),
    background var(--duration-fast) var(--ease-out);
}
.error-retry:hover {
  transform: translateY(-1px);
  background: var(--rose-200);
}
.error-retry:active {
  transform: translateY(0) scale(0.98);
}
</style>
