<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/auth";
import { computed } from "vue";

const authStore = useAuthStore();
const isSalon = computed(
  () => authStore.currentTenant?.businessVertical === "salon"
);
</script>

<template>
  <footer class="landing-footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <Icon
          :icon="isSalon ? 'mdi:content-cut' : 'mdi:silverware-fork-knife'"
          width="24"
          height="24"
        />
        <span>Vibespot</span>
      </div>
      <p class="footer-text">
        {{
          isSalon
            ? "Salon management platform by Vibespot Technologies Ltd."
            : "Restaurant Table Reservation System by Vibespot Technologies Ltd."
        }}
      </p>
      <p class="footer-copy">&copy; 2026 All rights reserved.</p>
      <slot name="admin-link" />
    </div>
  </footer>
</template>

<style scoped>
.landing-footer {
  border-top: 1px solid var(--border);
  padding: 48px 24px;
  text-align: center;
  background: white;
}

.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
}

.footer-brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 16px;
  margin-bottom: 10px;
  color: var(--ink);
}

.footer-text {
  margin: 0 0 6px;
  font-size: 13px;
  color: var(--ink-muted);
}

.footer-copy {
  margin: 0;
  font-size: 12px;
  color: var(--ink-subtle);
}

.admin-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 14px;
  padding: 8px 16px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: transparent;
  color: var(--ink-secondary);
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.admin-link:hover {
  background: var(--neutral-100);
  color: var(--ink);
  border-color: var(--neutral-300);
}
</style>
