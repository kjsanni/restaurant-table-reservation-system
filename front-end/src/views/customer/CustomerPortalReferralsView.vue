<script setup lang="ts">
import { ref, onMounted } from "vue";
import salonCustomerPortalAPI from "@/services/salonCustomerPortalAPI";
import logger from "@/utils/logger";

interface Referral {
  id: number;
  code: string;
  status: string;
  rewardType: string;
  rewardValue: number;
  rewardApplied: boolean;
  expiresAt?: string;
  completedAt?: string;
  note?: string;
  referrer?: { firstName?: string; lastName?: string; email?: string };
  referee?: { firstName?: string; lastName?: string; email?: string };
}

const loading = ref(true);
const referrals = ref<Referral[]>([]);
const errorMessage = ref("");

const loadReferrals = async () => {
  loading.value = true;
  errorMessage.value = "";
  try {
    const res = await salonCustomerPortalAPI.getReferrals();
    referrals.value = res.data?.referrals || [];
  } catch (err) {
    logger.error("Failed to load referrals", { error: err });
    errorMessage.value = "Failed to load referrals";
  } finally {
    loading.value = false;
  }
};

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    pending: "Pending",
    completed: "Completed",
    cancelled: "Cancelled",
    expired: "Expired",
  };
  return map[status] || status;
};

const statusClass = (status: string) => {
  const map: Record<string, string> = {
    pending: "t-pending",
    completed: "t-completed",
    cancelled: "t-cancelled",
    expired: "t-expired",
  };
  return map[status] || "t-pending";
};

const customerName = (customer?: { firstName?: string; lastName?: string }) => {
  if (!customer) return "—";
  return (
    [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "—"
  );
};

onMounted(loadReferrals);
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>Referrals</h1>
        <p>Track your referrals and rewards</p>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading referrals...</p>
      </div>

      <div v-else-if="errorMessage" class="error-state">
        <p>{{ errorMessage }}</p>
      </div>

      <div v-else class="referrals-list">
        <div v-if="!referrals.length" class="empty-state">
          <p>No referrals found.</p>
        </div>
        <div
          v-for="referral in referrals"
          :key="referral.id"
          class="referral-card"
        >
          <div class="referral-header">
            <div>
              <h3>{{ referral.code }}</h3>
              <span :class="['pill', statusClass(referral.status)]">
                {{ statusLabel(referral.status) }}
              </span>
            </div>
            <div class="referral-reward">
              <small>Reward</small>
              <strong
                >{{ referral.rewardType }} — {{ referral.rewardValue }}</strong
              >
              <span v-if="referral.rewardApplied" class="applied-badge"
                >Applied</span
              >
            </div>
          </div>
          <div class="referral-meta">
            <span>Referrer: {{ customerName(referral.referrer) }}</span>
            <span>Referee: {{ customerName(referral.referee) }}</span>
            <span v-if="referral.expiresAt">
              Expires: {{ new Date(referral.expiresAt).toLocaleDateString() }}
            </span>
            <span v-if="referral.completedAt">
              Completed:
              {{ new Date(referral.completedAt).toLocaleDateString() }}
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
.referrals-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.referral-card {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: 18px;
  box-shadow: 0 10px 30px rgba(26, 20, 16, 0.05);
}
.referral-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.referral-header h3 {
  font-family: var(--font-serif);
  font-size: 17px;
  font-weight: 700;
  color: var(--neutral-900);
}
.referral-reward {
  text-align: right;
}
.referral-reward small {
  display: block;
  font-size: 11px;
  color: var(--neutral-500);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.referral-reward strong {
  display: block;
  font-size: 16px;
  color: var(--neutral-900);
}
.applied-badge {
  display: inline-block;
  margin-top: 6px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #dbeafe;
  color: #1e40af;
  font-size: 11px;
  font-weight: 700;
}
.referral-meta {
  display: flex;
  gap: 14px;
  margin-top: 10px;
  font-size: 13px;
  color: var(--neutral-600);
  flex-wrap: wrap;
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
.t-pending {
  background: #fff7ed;
  color: #c2410c;
}
.t-completed {
  background: #ecfdf5;
  color: #047857;
}
.t-cancelled {
  background: #fef2f2;
  color: #b91c1c;
}
.t-expired {
  background: var(--neutral-100);
  color: var(--neutral-700);
}
</style>
