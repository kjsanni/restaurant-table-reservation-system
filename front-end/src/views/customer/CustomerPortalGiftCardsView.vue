<script setup lang="ts">
import { ref, onMounted } from "vue";
import salonCustomerPortalAPI from "@/services/salonCustomerPortalAPI";
import logger from "@/utils/logger";

interface GiftCard {
  id: number;
  code: string;
  amount: number;
  balance: number;
  currency: string;
  status: string;
  expiresAt?: string;
  redeemedAt?: string;
}

const loading = ref(true);
const giftCards = ref<GiftCard[]>([]);
const errorMessage = ref("");

const loadGiftCards = async () => {
  loading.value = true;
  errorMessage.value = "";
  try {
    const res = await salonCustomerPortalAPI.getGiftCards();
    giftCards.value = res.data?.giftCards || [];
  } catch (err) {
    logger.error("Failed to load gift cards", { error: err });
    errorMessage.value = "Failed to load gift cards";
  } finally {
    loading.value = false;
  }
};

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    active: "Active",
    redeemed: "Redeemed",
    expired: "Expired",
    cancelled: "Cancelled",
  };
  return map[status] || status;
};

const statusClass = (status: string) => {
  const map: Record<string, string> = {
    active: "t-active",
    redeemed: "t-redeemed",
    expired: "t-expired",
    cancelled: "t-cancelled",
  };
  return map[status] || "t-active";
};

const formatCurrency = (value: number, currency = "GHS") => {
  return `${currency} ${Number(value).toFixed(2)}`;
};

onMounted(loadGiftCards);
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>Gift Cards</h1>
        <p>View your gift card balances and history</p>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading gift cards...</p>
      </div>

      <div v-else-if="errorMessage" class="error-state">
        <p>{{ errorMessage }}</p>
      </div>

      <div v-else class="cards-list">
        <div v-if="!giftCards.length" class="empty-state">
          <p>No gift cards found.</p>
        </div>
        <div v-for="card in giftCards" :key="card.id" class="gift-card">
          <div class="gift-card-header">
            <div>
              <h3>{{ card.code }}</h3>
              <span :class="['pill', statusClass(card.status)]">
                {{ statusLabel(card.status) }}
              </span>
            </div>
            <div class="gift-card-balance">
              <small>Balance</small>
              <strong>{{ formatCurrency(card.balance, card.currency) }}</strong>
            </div>
          </div>
          <div class="gift-card-meta">
            <span
              >Original: {{ formatCurrency(card.amount, card.currency) }}</span
            >
            <span v-if="card.expiresAt">
              Expires: {{ new Date(card.expiresAt).toLocaleDateString() }}
            </span>
            <span v-if="card.redeemedAt">
              Redeemed: {{ new Date(card.redeemedAt).toLocaleDateString() }}
            </span>
          </div>
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
.cards-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.gift-card {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: 18px;
  box-shadow: 0 10px 30px rgba(26, 20, 16, 0.05);
}
.gift-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.gift-card-header h3 {
  font-family: var(--font-serif);
  font-size: 17px;
  font-weight: 700;
  color: var(--neutral-900);
}
.gift-card-balance {
  text-align: right;
}
.gift-card-balance small {
  display: block;
  font-size: 11px;
  color: var(--neutral-500);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.gift-card-balance strong {
  display: block;
  font-size: 18px;
  color: var(--neutral-900);
}
.gift-card-meta {
  display: flex;
  gap: 14px;
  margin-top: 10px;
  font-size: 13px;
  color: var(--neutral-600);
}
.pill {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
  margin-top: 6px;
}
.t-active {
  background: #ecfdf5;
  color: #047857;
}
.t-redeemed {
  background: #fff7ed;
  color: #c2410c;
}
.t-expired {
  background: var(--neutral-100);
  color: var(--neutral-700);
}
.t-cancelled {
  background: #fef2f2;
  color: #b91c1c;
}
</style>
