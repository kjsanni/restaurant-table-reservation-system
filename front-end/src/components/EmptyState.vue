<script setup lang="ts">
interface Props {
  icon?: string;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}
const props = defineProps<Props>();
</script>

<template>
  <div class="empty-state" role="status">
    <div v-if="icon" class="empty-icon" aria-hidden="true">{{ icon }}</div>
    <h3 v-if="title" class="empty-title">{{ title }}</h3>
    <p v-if="description" class="empty-description">{{ description }}</p>
    <button
      v-if="actionLabel && onAction"
      class="empty-action"
      type="button"
      @click="onAction"
    >
      {{ actionLabel }}
    </button>
  </div>
</template>

<style scoped>
.empty-state {
  text-align: center;
  padding: var(--space-16) var(--space-6);
  color: var(--ink-secondary);
  font-family: var(--font-sans);
}
.empty-icon {
  font-size: 48px;
  margin-bottom: var(--space-4);
  opacity: 0.7;
}
.empty-title {
  margin: 0 0 var(--space-2);
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--ink);
}
.empty-description {
  margin: 0 0 var(--space-4);
  font-size: var(--text-sm);
  color: var(--ink-muted);
}
.empty-action {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  border: none;
  background: linear-gradient(135deg, var(--brand-700), var(--brand-600));
  color: var(--white);
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: var(--text-sm);
  cursor: pointer;
  transition: transform var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);
}
.empty-action:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}
.empty-action:active {
  transform: translateY(0) scale(0.98);
}
</style>
