<script setup lang="ts">
import { ref, onMounted } from "vue";
import salonCustomerPortalAPI from "@/services/salonCustomerPortalAPI";
import logger from "@/utils/logger";

interface ServicePackage {
  id: number;
  name: string;
  description?: string;
  price: number;
  currency: string;
  durationMinutes?: number;
  isActive: boolean;
  items?: Array<{ serviceId?: number; quantity: number }>;
}

const loading = ref(true);
const packages = ref<ServicePackage[]>([]);
const errorMessage = ref("");

const loadPackages = async () => {
  loading.value = true;
  errorMessage.value = "";
  try {
    const res = await salonCustomerPortalAPI.getPackages();
    packages.value = res.data?.packages || [];
  } catch (err) {
    logger.error("Failed to load packages", { error: err });
    errorMessage.value = "Failed to load packages";
  } finally {
    loading.value = false;
  }
};

const formatCurrency = (value: number, currency = "GHS") => {
  return `${currency} ${Number(value).toFixed(2)}`;
};

onMounted(loadPackages);
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>Packages</h1>
        <p>Browse available service packages</p>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading packages...</p>
      </div>

      <div v-else-if="errorMessage" class="error-state">
        <p>{{ errorMessage }}</p>
      </div>

      <div v-else class="packages-grid">
        <div v-if="!packages.length" class="empty-state">
          <p>No packages available at the moment.</p>
        </div>
        <div v-for="pkg in packages" :key="pkg.id" class="package-card">
          <h3>{{ pkg.name }}</h3>
          <p v-if="pkg.description" class="package-desc">
            {{ pkg.description }}
          </p>
          <div class="package-meta">
            <span class="package-price">{{
              formatCurrency(pkg.price, pkg.currency)
            }}</span>
            <span v-if="pkg.durationMinutes" class="package-duration">
              {{ pkg.durationMinutes }} mins
            </span>
          </div>
          <div class="package items" v-if="pkg.items && pkg.items.length">
            <small>Includes {{ pkg.items.length }} service item(s)</small>
          </div>
          <span :class="['pill', pkg.isActive ? 't-active' : 't-inactive']">
            {{ pkg.isActive ? "Available" : "Unavailable" }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-wrapper {
  min-height: 100vh;
  background: var(--background-warm);
  display: flex;
  flex-direction: column;
}
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}
.topbar-left h1 {
  font-family: var(--font-serif);
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--neutral-900);
}
.topbar-left p {
  color: var(--neutral-600);
  font-size: 14px;
  margin-top: 4px;
}
.content-wrapper {
  flex: 1;
  margin: var(--space-8) var(--space-6);
  max-width: var(--content-max-width);
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}
@media (min-width: 1024px) {
  .content-wrapper {
    margin-top: var(--space-10);
    margin-bottom: var(--space-10);
  }
}
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px;
}
.spinner {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 3px solid var(--neutral-200);
  border-top-color: var(--brand-600);
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.error-state {
  color: #b91c1c;
  padding: 18px;
}
.empty-state {
  color: var(--neutral-500);
  padding: 18px;
}
.packages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 14px;
}
.package-card {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: 18px;
  box-shadow: 0 10px 30px rgba(26, 20, 16, 0.05);
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.package-card h3 {
  font-family: var(--font-serif);
  font-size: 17px;
  font-weight: 700;
  color: var(--neutral-900);
}
.package-desc {
  font-size: 13px;
  color: var(--neutral-600);
}
.package-meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}
.package-price {
  font-size: 18px;
  font-weight: 700;
  color: var(--neutral-900);
}
.package-duration {
  font-size: 12px;
  color: var(--neutral-500);
}
.package-items small {
  color: var(--neutral-500);
}
.pill {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
  align-self: flex-start;
}
.t-active {
  background: #ecfdf5;
  color: #047857;
}
.t-inactive {
  background: var(--neutral-100);
  color: var(--neutral-700);
}
</style>
