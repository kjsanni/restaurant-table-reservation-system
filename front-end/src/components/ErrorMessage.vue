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
  gap: 10px;
  padding: 14px 20px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: var(--card-radius, 12px);
}

.error-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.error-message {
  font-family: "Inter-Medium";
  font-size: 14px;
  color: #991b1b;
}
</style>
