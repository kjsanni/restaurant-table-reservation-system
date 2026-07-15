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
  gap: 10px;
  padding: 14px 20px;
  background: #ecfdf5;
  border: 1px solid #bbf7d0;
  border-radius: var(--card-radius, 12px);
}

.success-icon {
  font-size: 18px;
  flex-shrink: 0;
  color: #16a34a;
}

.success-message {
  font-family: "Inter-Medium";
  font-size: 14px;
  color: #166534;
}
</style>
