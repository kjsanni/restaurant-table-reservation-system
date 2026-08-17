<script setup>
defineProps({
  isSuccessful: { type: Boolean, required: true },
  successMessage: { type: String, default: "Success!" },
});
</script>

<template>
  <div v-if="isSuccessful" class="success-banner" role="status">
    <span class="success-icon" aria-hidden="true">✓</span>
    <span class="success-message">{{ successMessage }}</span>
  </div>
</template>

<style scoped>
.success-banner {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  background: var(--success-soft);
  border: 1px solid var(--earth-200);
  border-radius: var(--card-radius, var(--radius-xl));
}

.success-icon {
  font-size: 18px;
  flex-shrink: 0;
  color: var(--success);
}

.success-message {
  font-family: "Public Sans", var(--font-sans);
  font-size: var(--text-sm);
  color: var(--success);
}
</style>
