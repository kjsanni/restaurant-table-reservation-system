<script setup>
import { ref, watch, nextTick, onBeforeUnmount } from "vue";

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  headerText: { type: String, required: true },
  isClosable: { type: Boolean, default: true },
});
const emit = defineEmits(["close-modal"]);

const dialogRef = ref(null);
const titleId = `popup-title-${Math.random().toString(36).slice(2)}`;
let previouslyFocused = null;

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

const getFocusable = () => {
  if (!dialogRef.value) return [];
  return Array.from(dialogRef.value.querySelectorAll(FOCUSABLE));
};

const handleKeydown = (e) => {
  if (e.key === "Escape") {
    if (props.isClosable) emit("close-modal");
    return;
  }
  if (e.key === "Tab") {
    const focusable = getFocusable();
    if (focusable.length === 0) {
      e.preventDefault();
      dialogRef.value?.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
};

watch(
  () => props.isOpen,
  async (open) => {
    if (open) {
      previouslyFocused = document.activeElement;
      document.addEventListener("keydown", handleKeydown);
      await nextTick();
      const focusable = getFocusable();
      if (focusable.length) focusable[0].focus();
      else dialogRef.value?.focus();
    } else {
      document.removeEventListener("keydown", handleKeydown);
      if (previouslyFocused && typeof previouslyFocused.focus === "function") {
        previouslyFocused.focus();
      }
      previouslyFocused = null;
    }
  }
);

onBeforeUnmount(() => {
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="popup-overlay" @click.self="emit('close-modal')">
      <div
        class="popup-window"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        tabindex="-1"
        ref="dialogRef"
      >
        <div class="popup-header">
          <h3 :id="titleId" class="popup-title">{{ headerText }}</h3>
          <button
            v-if="isClosable"
            type="button"
            class="popup-close"
            aria-label="Close dialog"
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
