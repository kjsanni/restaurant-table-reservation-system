<script setup>
import { useToastStore } from "@/stores/toast";

const toastStore = useToastStore();
</script>

<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toastStore.toasts"
        :key="toast.id"
        class="toast"
        :class="toast.type"
        role="status"
        :aria-live="toast.type === 'error' ? 'assertive' : 'polite'"
      >
        <span class="toast-icon" aria-hidden="true">
          <svg
            v-if="toast.type === 'success'"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <svg
            v-else-if="toast.type === 'error'"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          <svg
            v-else
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </span>
        <span class="toast-message">{{ toast.message }}</span>
        <span
          class="toast-progress"
          :style="{ animationDuration: toast.duration + 'ms' }"
        ></span>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: var(--z-toast);
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
  width: min(380px, calc(100vw - 40px));
}

.toast {
  pointer-events: auto;
  min-width: 0;
  padding: 14px 16px;
  border-radius: var(--radius-lg);
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 500;
  color: white;
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.18),
    0 0 0 1px rgba(255, 255, 255, 0.08) inset;
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(18px) saturate(1.4);
  -webkit-backdrop-filter: blur(18px) saturate(1.4);
}

.toast::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.04;
  mix-blend-mode: overlay;
  pointer-events: none;
}

.toast-icon {
  display: inline-flex;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
}

.toast-message {
  flex: 1;
  line-height: 1.4;
}

.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: rgba(255, 255, 255, 0.35);
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  animation: progressShrink linear forwards;
}

.toast.success {
  background: rgba(54, 83, 20, 0.92);
}

.toast.error {
  background: rgba(159, 18, 57, 0.92);
}

.toast.info {
  background: rgba(30, 64, 175, 0.92);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(30px) scale(0.96);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes progressShrink {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .toast,
  .toast-progress {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
