<script setup lang="ts">
import { ref, onMounted } from "vue";
import salonCustomerPortalAPI from "@/services/salonCustomerPortalAPI";
import logger from "@/utils/logger";

interface PricingRule {
  id: number;
  name: string;
  ruleType: string;
  value: number;
  currency?: string;
  customerSegment?: string;
  isActive: boolean;
}

const loading = ref(true);
const rules = ref<PricingRule[]>([]);
const errorMessage = ref("");

const loadRules = async () => {
  loading.value = true;
  errorMessage.value = "";
  try {
    const res = await salonCustomerPortalAPI.getPricingRules();
    rules.value = res.data?.rules || [];
  } catch (err) {
    logger.error("Failed to load pricing rules", { error: err });
    errorMessage.value = "Failed to load pricing rules";
  } finally {
    loading.value = false;
  }
};

const formatValue = (rule: PricingRule) => {
  if (rule.ruleType === "percentage") {
    return `${rule.value}% off`;
  }
  if (rule.currency && rule.value) {
    return `${rule.currency} ${Number(rule.value).toFixed(2)} off`;
  }
  return `${rule.value} off`;
};

onMounted(loadRules);
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>Pricing Rules</h1>
        <p>Current offers and discounts available to you</p>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading pricing rules...</p>
      </div>

      <div v-else-if="errorMessage" class="error-state">
        <p>{{ errorMessage }}</p>
      </div>

      <div v-else class="rules-list">
        <div v-if="!rules.length" class="empty-state">
          <p>No active pricing rules at the moment.</p>
        </div>
        <div v-for="rule in rules" :key="rule.id" class="rule-card">
          <div class="rule-header">
            <h3>{{ rule.name }}</h3>
            <span :class="['pill', rule.isActive ? 't-active' : 't-inactive']">
              {{ rule.isActive ? "Active" : "Inactive" }}
            </span>
          </div>
          <p class="rule-value">{{ formatValue(rule) }}</p>
          <p v-if="rule.customerSegment" class="rule-segment">
            Segment: {{ rule.customerSegment }}
          </p>
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
  color: var(--rose-600);
  padding: 18px;
}
.empty-state {
  color: var(--neutral-500);
  padding: 18px;
}
.rules-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.rule-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--card-radius);
  padding: var(--space-4);
}
.rule-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.rule-header h3 {
  margin: 0;
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--text-base);
  color: var(--ink);
}
.rule-value {
  margin: 0 0 4px;
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: var(--text-sm);
  color: var(--accent);
}
.rule-segment {
  margin: 0;
  font-family: var(--font-sans);
  font-weight: 300;
  font-size: var(--text-xs);
  color: var(--ink-muted);
}
.pill {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  padding: 4px 10px;
  border-radius: 999px;
}
.pill.t-active {
  background: var(--accent-soft);
  color: var(--accent);
}
.pill.t-inactive {
  background: var(--neutral-100);
  color: var(--neutral-600);
}
</style>
