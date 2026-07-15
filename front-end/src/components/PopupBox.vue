<script setup>
const props = defineProps({
  isOpen: { type: Boolean, required: true },
  headerText: { type: String, required: true },
  isClosable: { type: Boolean, default: true },
});
const emit = defineEmits(["close-modal"]);
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="popup-overlay" @click.self="emit('close-modal')">
      <div class="popup-window">
        <div class="popup-header">
          <h3 class="popup-title">{{ headerText }}</h3>
          <button
            v-if="isClosable"
            type="button"
            class="popup-close"
            @click="emit('close-modal')"
          >
            ×
          </button>
        </div>
        <div class="popup-body">
          <slot name="popup-content" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.popup-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  backdrop-filter: blur(16px) saturate(1.2);
  -webkit-backdrop-filter: blur(16px) saturate(1.2);
  padding: var(--space-4);
}

.popup-window {
  background: var(--surface);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-2xl);
  max-width: 90vw;
  max-height: 90vh;
  width: 100%;
  max-width: 520px;
  overflow: auto;
  border: 1px solid var(--border);
  animation: modalIn 0.2s var(--ease-out);
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--border-subtle);
}

.popup-title {
  font-family: var(--font-sans);
  font-size: var(--text-lg);
  font-weight: 650;
  margin: 0;
  color: var(--ink);
  letter-spacing: var(--tracking-tight);
}

.popup-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--ink-muted);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  transition: all var(--duration-fast) var(--ease-in-out);
}

.popup-close:hover {
  background: var(--neutral-100);
  color: var(--ink);
}

.popup-body {
  padding: var(--space-6);
}
</style>
