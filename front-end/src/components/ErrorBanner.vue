<script setup>
defineProps({
  message: { type: String, required: true },
  onRetry: { type: Function, default: null },
});
</script>

<template>
  <div class="error-banner" role="alert">
    <span class="error-icon" aria-hidden="true">⚠️</span>
    <span class="error-message">{{ message }}</span>
    <button v-if="onRetry" type="button" class="error-retry" @click="onRetry">
      Retry
    </button>
  </div>
</template>

<style scoped>
.error-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: var(--card-radius);
}

.error-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.error-message {
  font-family: "Inter-Medium";
  font-size: 14px;
  color: #991b1b;
  flex: 1;
}

.error-retry {
  padding: 6px 14px;
  border: 1px solid #dc2626;
  border-radius: 6px;
  background: white;
  color: #dc2626;
  font-family: "Inter-Medium";
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}

.error-retry:hover {
  background: #fef2f2;
}
</style>
