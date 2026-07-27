<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useCapabilities } from "@/composables/useCapabilities";
import { useTenantBranding } from "@/composables/useTenantBranding";
import logger from "@/utils/logger";

const router = useRouter();
const authStore = useAuthStore();
const { businessVertical } = useCapabilities();
const { apply: applyBranding } = useTenantBranding();

const tenantName = computed(
  () =>
    authStore.currentTenant?.name ||
    (isSalon.value ? "Salon Portal" : "Restaurant Portal")
);
const isSalon = computed(() => businessVertical.value === "salon");

const portalLinks = computed(() => {
  const links = [
    { name: "My Profile", path: "/portal/profile", icon: "mdi:account" },
    {
      name: "Reservations",
      path: "/portal/reservations",
      icon: "mdi:calendar",
    },
    { name: "Orders", path: "/portal/orders", icon: "mdi:food" },
  ];
  if (isSalon.value) {
    links.splice(
      1,
      0,
      {
        name: "Appointments",
        path: "/portal/appointments",
        icon: "mdi:calendar-check",
      },
      { name: "Gift Cards", path: "/portal/gift-cards", icon: "mdi:gift" },
      {
        name: "Referrals",
        path: "/portal/referrals",
        icon: "mdi:account-group",
      },
      {
        name: "Packages",
        path: "/portal/packages",
        icon: "mdi:package-variant-closed",
      }
    );
  }
  return links;
});

onMounted(async () => {
  try {
    await applyBranding();
  } catch (err) {
    logger.error("Failed to apply customer portal branding", err);
  }
});
</script>

<template>
  <div class="portal-home">
    <div class="portal-header">
      <h1>{{ tenantName }} Portal</h1>
      <p>Welcome back! Ready for today's bookings?</p>
    </div>
    <div class="portal-links">
      <button
        v-for="link in portalLinks"
        :key="link.path"
        class="portal-link"
        @click="router.push(link.path)"
        :aria-label="link.name"
      >
        <span class="portal-link-icon">
          <span class="mdi" :class="link.icon"></span>
        </span>
        <span class="portal-link-text">{{ link.name }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.portal-home {
  max-width: 720px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-4);
}
.portal-header {
  margin-bottom: var(--space-8);
}
.portal-header h1 {
  font-family: var(--font-serif);
  font-size: 32px;
  font-weight: 700;
  color: var(--neutral-900);
  margin: 0 0 var(--space-2);
}
.portal-header p {
  color: var(--neutral-600);
  margin: 0;
  font-size: 15px;
}
.portal-links {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-4);
}
.portal-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-6) var(--space-4);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  background: var(--white);
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}
.portal-link:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
.portal-link-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--brand-700), var(--brand-600));
  color: var(--white);
  display: grid;
  place-items: center;
  font-size: 22px;
}
.portal-link-text {
  font-weight: 600;
  color: var(--neutral-900);
  font-size: 14px;
}
</style>
