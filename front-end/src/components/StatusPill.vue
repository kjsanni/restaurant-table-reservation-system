<script setup lang="ts">
interface Props {
  status: string;
  label?: string;
}
const props = defineProps<Props>();
</script>

<template>
  <span class="status-pill" :class="`status-${status}`">
    {{ label || status }}
  </span>
</template>

<style scoped>
.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  text-transform: capitalize;
  border: 1px solid transparent;
}
.status-available,
.status-confirmed,
.status-paid {
  background: rgba(34, 197, 94, 0.12);
  color: #15803d;
  border-color: rgba(34, 197, 94, 0.25);
}
.status-occupied,
.status-cancelled,
.status-failed {
  background: rgba(239, 68, 68, 0.12);
  color: #b91c1c;
  border-color: rgba(239, 68, 68, 0.25);
}
.status-pending,
.status-processing {
  background: rgba(234, 179, 8, 0.12);
  color: #a16207;
  border-color: rgba(234, 179, 8, 0.25);
}
.status-reserved,
.status-blocked {
  background: rgba(99, 102, 241, 0.12);
  color: #4338ca;
  border-color: rgba(99, 102, 241, 0.25);
}
</style>
