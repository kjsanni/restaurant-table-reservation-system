<script setup lang="ts">
interface Props {
  status: string;
  label?: string;
}
const props = defineProps<Props>();
</script>

<template>
  <span class="status-badge" :class="`status-${status}`">
    {{ label || status }}
  </span>
</template>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  line-height: 1;
  text-transform: capitalize;
  border: 1px solid transparent;
  font-family: var(--font-sans);
}
.status-success,
.status-confirmed,
.status-paid,
.status-available {
  background: var(--success-soft);
  color: var(--success);
  border-color: var(--earth-200);
}
.status-danger,
.status-cancelled,
.status-failed,
.status-occupied {
  background: var(--danger-soft);
  color: var(--danger);
  border-color: var(--rose-200);
}
.status-warning,
.status-pending,
.status-processing {
  background: var(--accent-soft);
  color: var(--accent-text);
  border-color: var(--accent-200);
}
.status-info,
.status-reserved,
.status-blocked {
  background: var(--info-soft);
  color: var(--info);
  border-color: var(--sky-200);
}
.status-muted {
  background: var(--neutral-100);
  color: var(--neutral-600);
  border-color: var(--neutral-200);
}
</style>
