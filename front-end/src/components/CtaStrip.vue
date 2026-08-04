<script setup lang="ts">
import { Icon } from "@iconify/vue";

defineProps<{
  isSalon: boolean;
}>();
const emit = defineEmits<{
  (e: "menu"): void;
  (e: "reserve"): void;
}>();
</script>

<template>
  <section class="cta-strip reveal-section">
    <div class="cta-inner">
      <div>
        <h2 v-if="isSalon">Ready for your appointment?</h2>
        <h2 v-else>Ready to dine?</h2>
        <p v-if="isSalon">
          Book your next haircut, color, or treatment online.
        </p>
        <p v-else>Join 2,400+ guests who order and book with us every month.</p>
      </div>
      <div class="cta-actions">
        <button v-if="!isSalon" class="btn-primary-lg" @click="emit('menu')">
          Order Now
        </button>
        <button class="btn-secondary-lg" @click="emit('reserve')">
          <span v-if="isSalon">Book Now</span>
          <span v-else>Book Table</span>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cta-strip {
  background: linear-gradient(
    135deg,
    var(--neutral-900) 0%,
    var(--brand-800) 100%
  );
  color: white;
  padding: 80px 24px;
  position: relative;
  overflow: hidden;
}

.cta-strip::before {
  content: "";
  position: absolute;
  top: -50%;
  right: -10%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(217, 119, 6, 0.15), transparent 60%);
  pointer-events: none;
}

.cta-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
}

.cta-inner h2 {
  margin: 0 0 8px;
  font-family: var(--font-serif);
  font-size: clamp(24px, 3.5vw, 32px);
  font-weight: 700;
  color: #ffffff;
}

.cta-inner p {
  margin: 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 15px;
}

.cta-actions {
  display: flex;
  gap: 12px;
}

.cta-strip .btn-primary-lg {
  background: linear-gradient(135deg, var(--accent-400), var(--accent-500));
}

.cta-strip .btn-secondary-lg {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  color: white;
  backdrop-filter: blur(8px);
}

.cta-strip .btn-secondary-lg:hover {
  background: rgba(255, 255, 255, 0.18);
  border-color: rgba(255, 255, 255, 0.3);
}

@media (max-width: 768px) {
  .cta-inner {
    flex-direction: column;
    text-align: center;
  }

  .cta-actions {
    width: 100%;
    justify-content: center;
  }
}
</style>
